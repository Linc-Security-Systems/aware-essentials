// transports/post-message-iframe.ts
// ----------------------------------------------------------------
// DuplexTransport backed by the window.postMessage API — agent side.
//
// Designed to run inside an iframe. Messages are received from the
// parent via the window 'message' event and sent to the parent via
// window.parent.postMessage.
//
// Implements DuplexTransport<string, string> — the exact same
// interface contract as WsDuplexTransport — so the full transport
// stack (WsJsonEncoder → LoggingDuplexTransport → AgentProtocol) can
// be composed without modification.
// ----------------------------------------------------------------

import { Observable, Subject, BehaviorSubject, fromEvent } from "rxjs";
import { filter, map, takeUntil } from "rxjs";
import { DuplexTransport } from "@awarevue/agent-sdk";

/* ---------------------------------------------------------------- */
/* Options                                                          */
/* ---------------------------------------------------------------- */

export interface PostMessageIframeDuplexTransportOptions {
  /**
   * The target origin used for outbound `postMessage` calls and for
   * filtering inbound messages by `event.origin`.
   *
   * Defaults to `'*'` (no origin filtering, send to any origin).
   * Set to a specific origin (e.g. `'https://app.example.com'`) for
   * production deployments to prevent cross-origin message leakage.
   */
  targetOrigin?: string;
}

/* ---------------------------------------------------------------- */
/* Implementation                                                   */
/* ---------------------------------------------------------------- */

export class PostMessageIframeDuplexTransport implements DuplexTransport<
  string,
  string
> {
  readonly connected$: Observable<boolean>;
  readonly messages$: Observable<string>;

  private readonly _connected$ = new BehaviorSubject<boolean>(true);
  private readonly destroy$ = new Subject<void>();
  private readonly targetOrigin: string;
  private closed = false;

  constructor(opts: PostMessageIframeDuplexTransportOptions = {}) {
    this.targetOrigin = opts.targetOrigin ?? "*";

    this.connected$ = this._connected$.asObservable();

    this.messages$ = fromEvent<MessageEvent>(window, "message").pipe(
      takeUntil(this.destroy$),
      filter((e) =>
        this.targetOrigin === "*" ? true : e.origin === this.targetOrigin,
      ),
      filter((e) => typeof e.data === "string"),
      map((e) => e.data as string),
    );
  }

  send(msg: string): void {
    window.parent.postMessage(msg, this.targetOrigin);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;

    this.destroy$.next();
    this.destroy$.complete();

    this._connected$.next(false);
    this._connected$.complete();
  }
}
