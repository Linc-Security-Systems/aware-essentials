// ws-agent-transport.ts
//--------------------------------------------------------------
// A robust, RxJS-friendly WebSocket transport for the Aware SDK
// •  automatic exponential back-off reconnect
// •  single outbound queue, no per-call subscriptions
// •  clean shutdown (no leaks)
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

import {
  FromAgent,
  FromServer,
  Message,
  WebSocketMessage,
} from '@awarevue/api-types';
import { Transport } from './transport';

export class WsAgentTransport implements Transport {
  //----------------------------------------
  //  Public reactive API
  //----------------------------------------
  readonly connected$: Observable<boolean>;
  readonly messages$: Observable<Message<FromServer>>;
  readonly errors$: Observable<Error>;

  //----------------------------------------
  //  Internals
  //----------------------------------------
  private ws!: WebSocket;

  private readonly _connected$ = new BehaviorSubject<boolean>(false);
  private readonly _messages$ = new Subject<Message<FromServer>>();
  private readonly _errors$ = new Subject<Error>();
  private readonly outbound$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  private reconnectDelay = 1_000; // start at 1 s
  private readonly maxDelay = 30_000; // cap at 30 s
  private destroyed = false;

  constructor(private readonly url: string) {
    this.connected$ = this._connected$.asObservable();
    this.messages$ = this._messages$.asObservable();
    this.errors$ = this._errors$.asObservable();

    this.connect(); // first connection
    this.setupSender(); // single outbound subscription
  }

  //----------------------------------------
  //  Public API
  //----------------------------------------
  send(msg: Message<FromAgent>): void {
    const { kind, ...data } = msg;
    const payload = JSON.stringify(<WebSocketMessage>{ event: kind, data });
    this.outbound$.next(payload);
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
            filter(Boolean), // wait until we’re actually connected
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
    this.ws = new WebSocket(this.url, {
      headers: { 'User-Agent': 'Aware Agent SDK' },
    });

    this.ws.on('open', () => {
      this.reconnectDelay = 1_000; // reset back-off
      this._connected$.next(true);
    });

    this.ws.on('message', (data) => {
      const raw = JSON.parse(data.toString()) as WebSocketMessage;
      this._messages$.next(<Message<FromServer>>{
        kind: raw.event,
        ...(raw.data as object),
      });
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
