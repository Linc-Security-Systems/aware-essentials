// post-message-hub.ts
// ----------------------------------------------------------------
// HubTransport backed by window.postMessage — host side.
//
// Unlike PostMessageHostDuplexTransport (which is a 1:1 DuplexTransport
// that requires an iframe element upfront), this class is a
// server-style hub: it discovers peers automatically from incoming
// window 'message' events, just like a WebSocket server accepts
// incoming connections.
//
// How peer discovery works:
//   1. The first JSON message from an unknown source window is parsed.
//   2. The `data.from` field (the stable agent ID chosen by the
//      developer, e.g. "demo_agent") is used as the TPeer identifier.
//   3. A PostMessagePeerTransport is created for that source window.
//   4. A 'join' PeerEvent is emitted so AgentServer can register it.
//   5. Subsequent messages from the same source are routed to the
//      existing peer transport without another round of parsing.
//
// Implements HubTransport<string, string, string> so it slots directly
// into WsJsonHubAdapter → AgentServer.
// ----------------------------------------------------------------

import {
  Observable,
  Subject,
  BehaviorSubject,
  Subscription,
  fromEvent,
} from "rxjs";
import { takeUntil } from "rxjs";
import { DuplexTransport, HubTransport, PeerEvent } from "@awarevue/agent-sdk";

/* ---------------------------------------------------------------- */
/* Internal: per-peer transport                                     */
/* ---------------------------------------------------------------- */

class PostMessagePeerTransport implements DuplexTransport<string, string> {
  readonly connected$: Observable<boolean>;
  readonly messages$: Observable<string>;

  private readonly _connected$ = new BehaviorSubject<boolean>(true);
  private readonly _messages$ = new Subject<string>();
  private closed = false;

  constructor(
    private readonly source: MessageEventSource,
    private readonly targetOrigin: string,
    private readonly onClose: () => void,
  ) {
    this.connected$ = this._connected$.asObservable();
    this.messages$ = this._messages$.asObservable();
  }

  /** Called by PostMessageHub to route an inbound string to this peer. */
  receive(msg: string): void {
    if (!this.closed) {
      this._messages$.next(msg);
    }
  }

  send(msg: string): void {
    if (!this.closed) {
      (this.source as Window).postMessage(msg, this.targetOrigin);
    }
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this._connected$.next(false);
    this._connected$.complete();
    this._messages$.complete();
    this.onClose();
  }
}

/* ---------------------------------------------------------------- */
/* Public: PostMessageHub                                           */
/* ---------------------------------------------------------------- */

export class PostMessageHub implements HubTransport<string, string, string> {
  private readonly _peerEvents$ = new Subject<PeerEvent<string>>();
  readonly peerEvents$: Observable<PeerEvent<string>> =
    this._peerEvents$.asObservable();

  private readonly peers = new Map<string, PostMessagePeerTransport>();
  /** Maps source window reference → agentId */
  private readonly sourceToAgent = new Map<MessageEventSource, string>();

  private readonly destroy$ = new Subject<void>();
  private readonly sub: Subscription;
  private closed = false;

  /**
   * @param targetOrigin  Target origin for outbound `postMessage` calls.
   *                      Defaults to `'*'`. Set to a specific origin in
   *                      production to prevent cross-origin message leakage.
   */
  constructor(private readonly targetOrigin: string = "*") {
    this.sub = fromEvent<MessageEvent>(window, "message")
      .pipe(takeUntil(this.destroy$))
      .subscribe((e) => this.onMessage(e));
  }

  private onMessage(e: MessageEvent): void {
    if (!e.source || typeof e.data !== "string") return;

    const existing = this.sourceToAgent.get(e.source);

    if (existing !== undefined) {
      // Route to existing peer
      this.peers.get(existing)?.receive(e.data);
      return;
    }

    // New source: parse the WsJsonEncoder envelope to extract agentId
    let agentId: string | undefined;
    try {
      const envelope = JSON.parse(e.data) as {
        data?: { from?: unknown };
      };
      const from = envelope?.data?.from;
      if (typeof from === "string" && from.length > 0) {
        agentId = from;
      }
    } catch {
      return; // not valid JSON — ignore
    }

    if (!agentId) return;

    // Guard against duplicate agentId from a different source
    if (this.peers.has(agentId)) {
      // Route anyway — same agent re-connecting on a different source
      this.peers.get(agentId)?.receive(e.data);
      return;
    }

    const transport = new PostMessagePeerTransport(
      e.source,
      this.targetOrigin,
      () => this.closePeer(agentId!),
    );

    this.peers.set(agentId, transport);
    this.sourceToAgent.set(e.source, agentId);

    this._peerEvents$.next({ type: "join", peer: agentId });

    // Replay the first message into the peer stream
    transport.receive(e.data);
  }

  connection(peer: string): DuplexTransport<string, string> | null {
    return this.peers.get(peer) ?? null;
  }

  closePeer(peer: string): void {
    const transport = this.peers.get(peer);
    if (!transport) return;

    // Remove maps first to prevent re-entry from transport.close()
    for (const [src, id] of this.sourceToAgent) {
      if (id === peer) {
        this.sourceToAgent.delete(src);
        break;
      }
    }
    this.peers.delete(peer);

    transport.close(); // no-op if already closed
    this._peerEvents$.next({ type: "leave", peer });
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;

    this.destroy$.next();
    this.destroy$.complete();
    this.sub.unsubscribe();

    for (const peer of [...this.peers.keys()]) {
      this.closePeer(peer);
    }

    this._peerEvents$.complete();
  }
}
