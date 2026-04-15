// transports/ws.ts
// ----------------------------------------------------------------
// Generic WebSocket-backed DuplexTransport with auto-reconnect.
// Unlike WsAgentTransport (which is protocol-aware), this is a
// reusable building block for any TIn / TOut message pair.
// ----------------------------------------------------------------

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

import { DuplexTransport } from '../transport_types';

/* ---------------------------------------------------------------- */
/* Options                                                          */
/* ---------------------------------------------------------------- */

export interface WsDuplexTransportOptions {
  /** WebSocket endpoint URL (ws:// or wss://) */
  url: string;

  /**
   * Optional headers sent during the WebSocket handshake
   * (e.g. Authorization, User-Agent).
   */
  headers?: Record<string, string>;

  /** Initial reconnect delay in ms (default 1 000). */
  reconnectDelay?: number;

  /** Maximum reconnect delay in ms (default 30 000). */
  maxReconnectDelay?: number;

  /** When false, no automatic reconnect is attempted (default true). */
  autoReconnect?: boolean;
}

/* ---------------------------------------------------------------- */
/* Implementation                                                   */
/* ---------------------------------------------------------------- */

export class WsDuplexTransport implements DuplexTransport<string, string> {
  // ---- public observables ----
  readonly connected$: Observable<boolean>;
  readonly messages$: Observable<string>;
  readonly errors$: Observable<Error>;

  // ---- internal subjects ----
  private readonly _connected$ = new BehaviorSubject<boolean>(false);
  private readonly _messages$ = new Subject<string>();
  private readonly _errors$ = new Subject<Error>();
  private readonly outbound$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  // ---- state ----
  private ws!: WebSocket;
  private reconnectDelay: number;
  private readonly maxDelay: number;
  private readonly autoReconnect: boolean;
  private destroyed = false;

  constructor(private readonly opts: WsDuplexTransportOptions) {
    this.connected$ = this._connected$.asObservable();
    this.messages$ = this._messages$.asObservable();
    this.errors$ = this._errors$.asObservable();

    this.reconnectDelay = opts.reconnectDelay ?? 1_000;
    this.maxDelay = opts.maxReconnectDelay ?? 30_000;
    this.autoReconnect = opts.autoReconnect ?? true;

    this.connect();
    this.setupSender();
  }

  /* -------------------------------------------------------------- */
  /* Public API                                                     */
  /* -------------------------------------------------------------- */

  send(msg: string): void {
    this.outbound$.next(msg);
  }

  close(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    this.destroy$.next();
    this.destroy$.complete();

    this._connected$.complete();
    this._messages$.complete();
    this._errors$.complete();

    this.ws?.terminate();
  }

  /* -------------------------------------------------------------- */
  /* Private helpers                                                */
  /* -------------------------------------------------------------- */

  /** Single subscription that drains the outbound queue when connected. */
  private setupSender(): void {
    this.outbound$
      .pipe(
        concatMap((payload) =>
          this._connected$.pipe(
            filter(Boolean),
            take(1),
            takeUntil(this.destroy$),
            map(() => payload),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((payload) => {
        this.ws.send(payload);
      });
  }

  /** Establish (or re-establish) the WebSocket connection. */
  private connect(): void {
    this.ws = new WebSocket(this.opts.url, {
      headers: this.opts.headers,
    });

    this.ws.on('open', () => {
      this.reconnectDelay = this.opts.reconnectDelay ?? 1_000;
      this._connected$.next(true);
    });

    this.ws.on('message', (data: Buffer | string) => {
      try {
        const msg = data.toString();
        this._messages$.next(msg);
      } catch (err) {
        this._errors$.next(err instanceof Error ? err : new Error(String(err)));
      }
    });

    this.ws.on('error', (err: Error) => {
      this._errors$.next(err);
    });

    this.ws.on('close', () => {
      this._connected$.next(false);
      if (!this.destroyed && this.autoReconnect) {
        this.scheduleReconnect();
      }
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
