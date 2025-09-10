// agent-protocol.ts
//--------------------------------------------------------------
// Protocol layer for Aware Agent SDK that handles JSON serialization
// • wraps a raw transport (string/Buffer)
// • converts between Message<T> and WebSocketMessage format
// • delegates connection management to underlying transport
//--------------------------------------------------------------

import { Observable, map, filter } from 'rxjs';

import {
  FromAgent,
  FromServer,
  Message,
  WebSocketMessage,
} from '@awarevue/api-types';
import { Transport } from '../transport/transport';

export class AgentMessageEncoder<TTransportPeer>
  implements
    Transport<
      Message<FromServer | FromAgent>,
      Message<FromServer | FromAgent>,
      TTransportPeer
    >
{
  //----------------------------------------
  //  Public reactive API
  //----------------------------------------
  readonly connected$: Observable<[boolean, TTransportPeer]>;
  readonly messages$: Observable<
    [Message<FromServer | FromAgent>, TTransportPeer]
  >;

  constructor(
    private readonly rawTransport: Transport<
      string | Buffer,
      string | Buffer,
      TTransportPeer
    >,
  ) {
    this.connected$ = rawTransport.connected$;
    this.messages$ = rawTransport.messages$.pipe(
      map(([data, peer]) => [this.parseMessage(data), peer] as const),
      filter(
        (pair): pair is [Message<FromServer | FromAgent>, TTransportPeer] =>
          pair[0] !== null,
      ),
    );
  }

  //----------------------------------------
  //  Public API
  //----------------------------------------
  send(msg: Message<FromAgent | FromServer>, to: TTransportPeer | null = null) {
    const { kind } = msg;
    try {
      const payload = JSON.stringify(<WebSocketMessage>{
        event: kind,
        data: msg,
      });
      this.rawTransport.send(payload, to);
    } catch (err) {
      console.error(
        `Failed to serialize message: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /** Call once when your container/module shuts down. */
  close(): void {
    // Delegate close to underlying transport
    this.rawTransport.close();
  }

  //----------------------------------------
  //  Private helpers
  //----------------------------------------
  private parseMessage(
    data: string | Buffer,
  ): Message<FromServer | FromAgent> | null {
    try {
      // Convert Buffer to string if needed
      const rawString: string =
        typeof data === 'string' ? data : data.toString();

      // Filter out non-JSON messages (e.g., binary data, HTTP frames)
      // JSON messages should always start with '{'
      if (!rawString.startsWith('{')) {
        return null; // Silently ignore non-JSON messages
      }

      // Parse JSON
      const raw = JSON.parse(rawString) as WebSocketMessage;

      // Convert to Message format
      return <Message<FromServer | FromAgent>>{
        kind: raw.event,
        ...(raw.data as object),
      };
    } catch (err) {
      console.error(
        `Failed to parse message: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }
}
