// ws-transport.ts
//--------------------------------------------------------------
// A robust, RxJS-friendly WebSocket transport (protocol-agnostic)
// •  automatic exponential back-off reconnect
// •  single outbound queue, no per-call subscriptions
// •  clean shutdown (no leaks)
// •  handles raw string/binary data only
//--------------------------------------------------------------

import { WebSocket } from 'ws';
import {
  BehaviorSubject,
  Subject,
  Observable,
  timer,
  concatMap,
  filter,
  map,
  take,
  takeUntil,
} from 'rxjs';
import { Transport } from './transport';

export class WsTransport
  implements Transport<string | Buffer, string | Buffer>
{
  //----------------------------------------
  //  Public reactive API
  //----------------------------------------
  readonly connected$: Observable<boolean>;
  readonly messages$: Observable<string | Buffer>;
  readonly errors$: Observable<Error>;

  //----------------------------------------
  //  Internals
  //----------------------------------------
  private ws!: WebSocket;

  private readonly _connected$ = new BehaviorSubject<boolean>(false);
  private readonly _messages$ = new Subject<string | Buffer>();
  private readonly _errors$ = new Subject<Error>();
  private readonly outbound$ = new Subject<string | Buffer>();
  private readonly destroy$ = new Subject<void>();

  private reconnectDelay = 1_000; // start at 1 s
  private readonly maxDelay: number = 30_000; // cap at 30 s
  private destroyed = false;

  constructor(
    private readonly url: string,
    private readonly options?: {
      headers?: Record<string, string>;
      reconnectDelay?: number;
      maxDelay?: number;
    },
  ) {
    this.connected$ = this._connected$.asObservable();
    this.messages$ = this._messages$.asObservable();
    this.errors$ = this._errors$.asObservable();

    this.reconnectDelay = options?.reconnectDelay ?? 1_000;
    this.maxDelay = options?.maxDelay ?? 30_000;

    this.connect(); // first connection
    this.setupSender(); // single outbound subscription
  }

  //----------------------------------------
  //  Public API
  //----------------------------------------
  send(data: string | Buffer): void {
    this.outbound$.next(data);
  }

  /** Call once when your container/module shuts down. */
  close(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    this.destroy$.next();
    this.destroy$.complete();

    this._connected$.complete();
    this._messages$.complete();
    this._errors$.complete();

    /** terminate() is immediate; skip the close handshake intentionally */
    this.ws?.terminate();
  }

  //----------------------------------------
  //  Private helpers
  //----------------------------------------
  /** One subscription for all outbound traffic. */
  private setupSender(): void {
    this.outbound$
      .pipe(
        concatMap((payload) =>
          this._connected$.pipe(
            filter(Boolean), // wait until we're actually connected
            take(1), // just the next open
            takeUntil(this.destroy$),
            map(() => payload), // pass the original payload through
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((payload) => {
        /* readyState **must** be OPEN here by construction */
        this.ws.send(payload);
      });
  }

  /** Establish or re-establish a WebSocket connection. */
  private connect(): void {
    const headers = {
      'User-Agent': 'Aware SDK Transport',
      ...this.options?.headers,
    };

    this.ws = new WebSocket(this.url, { headers });

    this.ws.on('open', () => {
      this.reconnectDelay = this.options?.reconnectDelay ?? 1_000; // reset back-off
      this._connected$.next(true);
    });

    this.ws.on('message', (data) => {
      // Pass through raw data - let higher layers handle parsing
      this._messages$.next(data instanceof Buffer ? data : data.toString());
    });

    this.ws.on('error', (err) => {
      this._errors$.next(err);
      // the 'close' handler will schedule reconnect
    });

    this.ws.on('close', () => {
      this._connected$.next(false);
      if (!this.destroyed) this.scheduleReconnect();
    });
  }

  /** Exponential back-off reconnect, cancelled via destroy$. */
  private scheduleReconnect(): void {
    timer(this.reconnectDelay)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.connect());

    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
  }
}
