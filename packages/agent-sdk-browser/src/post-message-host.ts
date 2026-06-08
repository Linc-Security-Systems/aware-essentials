// transports/post-message-host.ts
// ----------------------------------------------------------------
// DuplexTransport backed by the window.postMessage API — host side.
//
// Designed to run in the parent page. One instance wraps a single
// HTMLIFrameElement: inbound messages are accepted only when
// event.source matches that iframe's contentWindow, and outbound
// messages are sent directly to iframe.contentWindow.postMessage.
//
// Implements DuplexTransport<string, string> — the exact same
// interface contract as WsServerDuplexTransport — so it plugs into
// InMemoryHub + AgentServer without any changes to the server stack.
// ----------------------------------------------------------------

import { Observable, Subject, BehaviorSubject, fromEvent } from "rxjs";
import { filter, map, takeUntil } from "rxjs";
import { DuplexTransport } from "@awarevue/agent-sdk";

/* ---------------------------------------------------------------- */
/* Implementation                                                   */
/* ---------------------------------------------------------------- */

export class PostMessageHostDuplexTransport implements DuplexTransport<
  string,
  string
> {
  readonly connected$: Observable<boolean>;
  readonly messages$: Observable<string>;

  private readonly _connected$ = new BehaviorSubject<boolean>(true);
  private readonly destroy$ = new Subject<void>();
  private readonly targetOrigin: string;
  private closed = false;

  /**
   * @param iframe       The iframe element whose agent this transport represents.
   * @param targetOrigin Target origin for outbound `postMessage` calls and for
   *                     filtering inbound messages by `event.origin`.
   *                     Defaults to `'*'`.
   */
  constructor(
    private readonly iframe: HTMLIFrameElement,
    targetOrigin: string = "*",
  ) {
    this.targetOrigin = targetOrigin;
    this.connected$ = this._connected$.asObservable();

    this.messages$ = fromEvent<MessageEvent>(window, "message").pipe(
      takeUntil(this.destroy$),
      filter((e) => e.source === this.iframe.contentWindow),
      filter((e) =>
        this.targetOrigin === "*" ? true : e.origin === this.targetOrigin,
      ),
      filter((e) => typeof e.data === "string"),
      map((e) => e.data as string),
    );
  }

  send(msg: string): void {
    this.iframe.contentWindow!.postMessage(msg, this.targetOrigin);
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
