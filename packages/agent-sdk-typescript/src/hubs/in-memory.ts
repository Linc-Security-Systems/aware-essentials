import { Subject, Subscription } from 'rxjs';
import {
  PeerId,
  HubTransport,
  PeerEvent,
  DuplexTransport,
} from '../transport_types';

export class InMemoryHub<
  TIn,
  TOut,
  TPeer extends PeerId,
> implements HubTransport<TIn, TOut, TPeer> {
  private readonly peerEventsSubject = new Subject<PeerEvent<TPeer>>();
  private readonly messagesSubject = new Subject<{ peer: TPeer; msg: TIn }>();

  private readonly peers = new Map<TPeer, DuplexTransport<TIn, TOut>>();
  private readonly peerSubs = new Map<TPeer, Subscription>();

  readonly peerEvents$ = this.peerEventsSubject.asObservable();
  readonly messages$ = this.messagesSubject.asObservable();

  addPeer(peerId: TPeer, conn: DuplexTransport<TIn, TOut>) {
    // defensive: if peer already exists, clean it first
    if (this.peers.has(peerId)) this.removePeer(peerId, 'replaced');

    this.peers.set(peerId, conn);
    this.peerEventsSubject.next({ type: 'join', peer: peerId });

    const sub = new Subscription();

    sub.add(
      conn.messages$.subscribe((msg) => {
        this.messagesSubject.next({ peer: peerId, msg });
      }),
    );

    sub.add(
      conn.connected$.subscribe((connected) => {
        if (!connected) this.removePeer(peerId, 'disconnect');
      }),
    );

    this.peerSubs.set(peerId, sub);
  }

  removePeer(peerId: TPeer, reason?: unknown) {
    if (!this.peers.has(peerId)) return;

    // tear down subscriptions FIRST
    this.peerSubs.get(peerId)?.unsubscribe();
    this.peerSubs.delete(peerId);

    this.peers.delete(peerId);
    this.peerEventsSubject.next({ type: 'leave', peer: peerId, reason });
  }

  closePeer(peerId: TPeer) {
    this.peers.get(peerId)?.close();
    this.removePeer(peerId, 'closed');
  }

  close() {
    for (const [peerId, conn] of this.peers) {
      conn.close();
      this.peerSubs.get(peerId)?.unsubscribe();
    }
    this.peerSubs.clear();
    this.peers.clear();

    // optional: if the hub itself is done
    this.peerEventsSubject.complete();
    this.messagesSubject.complete();
  }

  broadcast(msg: TOut): void {
    for (const [, conn] of this.peers) conn.send(msg);
  }

  connection(peerId: TPeer) {
    return this.peers.get(peerId) ?? null;
  }

  sendTo(msg: TOut, peerId: TPeer) {
    this.peers.get(peerId)?.send(msg);
  }
}
