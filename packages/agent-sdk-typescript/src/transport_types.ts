import { Observable } from 'rxjs';

/**
 * Coherent model:
 * - DuplexTransport: single logical connection (agent-friendly)
 * - HubTransport: multiplexed routing over many peers (server-friendly)
 * - HubTransport.connection(peer): projects a peer into a DuplexTransport
 *
 * This avoids "parity" traps: agent does not pretend it can manage peers.
 */

/* ---------------------------------- */
/* Core: single-connection transport  */
/* ---------------------------------- */

export interface DuplexTransport<TIn, TOut> {
  /** True when this logical connection is up */
  readonly connected$: Observable<boolean>;

  /** Incoming messages on this connection */
  readonly messages$: Observable<TIn>;

  /** Send on this connection */
  send(msg: TOut): void;

  /** Close this connection */
  close(): void;
}

/* ---------------------------------- */
/* Hub: multi-peer transport          */
/* ---------------------------------- */

export type PeerId = string | number;

export type PeerEvent<TPeer> =
  | { type: 'join'; peer: TPeer }
  | { type: 'leave'; peer: TPeer; reason?: unknown };

export interface HubTransport<TIn, TOut, TPeer> {
  /** Peer join/leave stream */
  readonly peerEvents$: Observable<PeerEvent<TPeer>>;

  /** Disconnect one peer */
  closePeer(peer: TPeer): void;

  /** Close hub transport */
  close(): void;

  /**
   * Project a peer into a single-connection view.
   * This is the key to reuse agent-side SDK logic against a hub peer.
   */
  connection(peer: TPeer): DuplexTransport<TIn, TOut> | null;
}
