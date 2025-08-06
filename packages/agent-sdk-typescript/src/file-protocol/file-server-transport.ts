// file-server-transport.ts
//--------------------------------------------------------------
// HTTP tunnel protocol transport for file server communication
// • Implements Transport<RequestMessage, ResponseMessage>
// • Handles serialization/deserialization of HTTP tunnel messages
// • Wraps raw transport for binary protocol communication
//--------------------------------------------------------------

import { Subject, Observable, takeUntil, map, filter } from 'rxjs';
import { Transport } from '../transport';
import { RequestMessage, ResponseMessage, HttpTunnelMessage } from './types';
import { serialize, deserialize } from './serializer';

export class FileServerTransport
  implements Transport<RequestMessage, ResponseMessage>
{
  //----------------------------------------
  //  Public reactive API
  //----------------------------------------
  readonly connected$: Observable<boolean>;
  readonly messages$: Observable<RequestMessage>;
  readonly errors$: Observable<Error>;

  //----------------------------------------
  //  Internals
  //----------------------------------------
  private readonly _errors$ = new Subject<Error>();
  private readonly destroy$ = new Subject<void>();
  private destroyed = false;

  constructor(
    private readonly rawTransport: Transport<string | Buffer, string | Buffer>,
  ) {
    // Delegate connection state directly
    this.connected$ = rawTransport.connected$;

    // Combine transport errors with protocol errors
    this.errors$ = new Subject<Error>();
    rawTransport.errors$
      .pipe(takeUntil(this.destroy$))
      .subscribe(this._errors$);

    // Parse incoming messages and handle errors
    this.messages$ = rawTransport.messages$.pipe(
      takeUntil(this.destroy$),
      map((data) => this.parseMessage(data)),
      filter((msg): msg is RequestMessage => msg !== null),
    );

    // Forward our protocol errors to the combined error stream
    this._errors$
      .pipe(takeUntil(this.destroy$))
      .subscribe((err) => (this.errors$ as Subject<Error>).next(err));
  }

  //----------------------------------------
  //  Public API
  //----------------------------------------
  send(request: ResponseMessage): void {
    if (this.destroyed) {
      this._errors$.next(new Error('Cannot send on destroyed transport'));
      return;
    }

    try {
      const serialized = serialize(request);
      this.rawTransport.send(serialized);
    } catch (err) {
      this._errors$.next(
        new Error(
          `Failed to serialize request: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
    }
  }

  /** Close the transport */
  close(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    this.destroy$.next();
    this.destroy$.complete();
    this._errors$.complete();

    // Delegate close to underlying transport
    this.rawTransport.close();
  }

  //----------------------------------------
  //  Private helpers
  //----------------------------------------
  private parseMessage(data: string | Buffer): RequestMessage | null {
    try {
      // Only handle binary data for HTTP tunnel protocol
      if (typeof data === 'string') {
        return null; // Ignore JSON messages
      }

      // Deserialize binary data
      const message = deserialize(data) as HttpTunnelMessage;

      // Only return RequestMessage types
      if ('path' in message && !('status' in message)) {
        return message as RequestMessage;
      }

      return null; // Ignore ResponseMessage types
    } catch (err) {
      this._errors$.next(
        new Error(
          `Failed to parse message: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
      return null;
    }
  }
}
