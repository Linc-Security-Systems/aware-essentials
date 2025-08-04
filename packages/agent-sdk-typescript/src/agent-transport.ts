// agent-protocol.ts
//--------------------------------------------------------------
// Protocol layer for Aware Agent SDK that handles JSON serialization
// • wraps a raw transport (string/Buffer)
// • converts between Message<T> and WebSocketMessage format
// • delegates connection management to underlying transport
//--------------------------------------------------------------

import { Subject, Observable, takeUntil, map, filter } from 'rxjs';

import {
  FromAgent,
  FromServer,
  Message,
  WebSocketMessage,
} from '@awarevue/api-types';
import { Transport } from './transport';

export class AgentTransport
  implements Transport<Message<FromServer>, Message<FromAgent>>
{
  //----------------------------------------
  //  Public reactive API
  //----------------------------------------
  readonly connected$: Observable<boolean>;
  readonly messages$: Observable<Message<FromServer>>;
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
      filter((msg): msg is Message<FromServer> => msg !== null),
    );

    // Forward our protocol errors to the combined error stream
    this._errors$
      .pipe(takeUntil(this.destroy$))
      .subscribe((err) => (this.errors$ as Subject<Error>).next(err));
  }

  //----------------------------------------
  //  Public API
  //----------------------------------------
  send(msg: Message<FromAgent>): void {
    if (this.destroyed) {
      this._errors$.next(new Error('Cannot send on destroyed transport'));
      return;
    }

    try {
      const { kind, ...data } = msg;
      const payload = JSON.stringify(<WebSocketMessage>{
        event: kind,
        data,
      });
      this.rawTransport.send(payload);
    } catch (err) {
      this._errors$.next(
        new Error(
          `Failed to serialize message: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
    }
  }

  /** Call once when your container/module shuts down. */
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
  private parseMessage(data: string | Buffer): Message<FromServer> | null {
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
      return <Message<FromServer>>{
        kind: raw.event,
        ...(raw.data as object),
      };
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
