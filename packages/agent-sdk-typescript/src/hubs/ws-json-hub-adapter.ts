// hubs/ws-json-hub-adapter.ts
// ----------------------------------------------------------------
// Wraps a HubTransport<string, string, TPeer> and exposes it as
// HubTransport<Message<FromAgent>, Message<FromServer>, TPeer> by
// decorating each peer connection with WsJsonEncoder.
//
// This is the hub-level mirror of WsJsonEncoder: instead of adapting
// a single DuplexTransport, it adapts every peer connection inside a hub.
// ----------------------------------------------------------------

import { Observable } from 'rxjs';
import { FromAgent, FromServer, Message } from '@awarevue/api-types';
import {
  HubTransport,
  DuplexTransport,
  PeerEvent,
  PeerId,
} from '../transport_types';
import { WsJsonEncoder } from '../transports/ws-json-encoder';

export class WsJsonHubAdapter<
  TPeer extends PeerId = string,
> implements HubTransport<Message<FromAgent>, Message<FromServer>, TPeer> {
  readonly peerEvents$: Observable<PeerEvent<TPeer>>;

  constructor(private readonly inner: HubTransport<string, string, TPeer>) {
    this.peerEvents$ = inner.peerEvents$;
  }

  connection(
    peer: TPeer,
  ): DuplexTransport<Message<FromAgent>, Message<FromServer>> | null {
    const conn = this.inner.connection(peer);
    if (!conn) return null;
    // WsJsonEncoder handles both directions; cast to the server-side view
    return new WsJsonEncoder(conn) as unknown as DuplexTransport<
      Message<FromAgent>,
      Message<FromServer>
    >;
  }

  closePeer(peer: TPeer): void {
    this.inner.closePeer(peer);
  }

  close(): void {
    this.inner.close();
  }
}
