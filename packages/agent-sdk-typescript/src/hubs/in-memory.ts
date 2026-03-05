import { Subject } from 'rxjs';
import { share } from 'rxjs/operators';
import {
  DuplexTransport,
  HubTransport,
  PeerEvent,
  PeerId,
} from '../transport_types';

export class InMemoryHub<TIn, TOut, TPeer extends PeerId>
  implements HubTransport<TIn, TOut, TPeer>
{
  private readonly peerEventsSubject = new Subject<PeerEvent<TPeer>>();

  private readonly messagesSubject = new Subject<{
    peer: TPeer;
    msg: TIn;
  }>();

  private readonly peers = new Map<TPeer, DuplexTransport<TIn, TOut>>();

  readonly peerEvents$ = this.peerEventsSubject.asObservable().pipe(share());
  readonly messages$ = this.messagesSubject.asObservable().pipe(share());

  broadcast(msg: TOut): void {
    for (const [, conn] of this.peers) conn.send(msg);
  }

  connection(peer: TPeer): DuplexTransport<TIn, TOut> | null {
    const conn = this.peers.get(peer);
    return conn ?? null;
  }

  /** server calls this when a peer connects */
  addPeer(peerId: TPeer, conn: DuplexTransport<TIn, TOut>) {
    this.peers.set(peerId, conn);
    this.peerEventsSubject.next({ type: 'join', peer: peerId });

    // forward inbound messages into hub stream
    conn.messages$.subscribe((msg) => {
      this.messagesSubject.next({ peer: peerId, msg });
    });

    // forward disconnect into hub peerEvents
    conn.connected$.subscribe((connected) => {
      if (!connected) this.removePeer(peerId, 'disconnect');
    });
  }

  /** server calls this when it knows the peer is gone */
  removePeer(peerId: TPeer, reason?: unknown) {
    if (!this.peers.has(peerId)) return;
    this.peers.delete(peerId);
    this.peerEventsSubject.next({ type: 'leave', peer: peerId, reason });
  }

  sendTo(msg: TOut, peerId: TPeer) {
    this.peers.get(peerId)?.send(msg);
  }

  closePeer(peerId: TPeer) {
    this.peers.get(peerId)?.close();
    this.removePeer(peerId, 'closed');
  }

  close() {
    for (const [, conn] of this.peers) conn.close();
    this.peers.clear();
  }
}
