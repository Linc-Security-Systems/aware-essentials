import { WebSocket } from "ws";
import { BehaviorSubject, Subject, Observable } from "rxjs";
import { DuplexTransport } from "@awarevue/agent-sdk";

/**
 * Wraps a server-accepted WebSocket into a DuplexTransport.
 * Unlike WsDuplexTransport (client-side), this has no reconnect logic —
 * the socket is already established by the server's accept.
 */
export class WsServerDuplexTransport<TIn, TOut>
  implements DuplexTransport<TIn, TOut>
{
  readonly connected$: Observable<boolean>;
  readonly messages$: Observable<TIn>;

  private readonly _connected$ = new BehaviorSubject<boolean>(true);
  private readonly _messages$ = new Subject<TIn>();
  private closed = false;

  private defaultDeserializer = (raw: string) => {
    const env = JSON.parse(raw) as { event: string; data: unknown };
    return {
      kind: env.event,
      ...(env.data as TIn),
    };
  };

  private defaultSerializer = (msg: TOut) => {
    if (typeof msg === "object" && "kind" in (msg || {})) {
      const { kind, ...data } = msg as unknown as {
        kind: string;
        [key: string]: unknown;
      };
      return JSON.stringify({ event: kind, data });
    }
    return JSON.stringify(msg);
  };

  constructor(private readonly ws: WebSocket) {
    this.connected$ = this._connected$.asObservable();
    this.messages$ = this._messages$.asObservable();

    ws.on("message", (data: Buffer | string) => {
      try {
        const msg = this.defaultDeserializer(data.toString());
        this._messages$.next(msg);
      } catch {
        // ignore malformed messages
      }
    });

    ws.on("close", () => {
      this._connected$.next(false);
      this.cleanup();
    });

    ws.on("error", () => {
      this._connected$.next(false);
      this.cleanup();
    });
  }

  send(msg: TOut): void {
    if (this.closed) return;
    this.ws.send(this.defaultSerializer(msg));
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;

    // Prefer a graceful close first; terminate as fallback
    try {
      this.ws.close();
    } catch {}
    setTimeout(() => {
      try {
        this.ws.terminate();
      } catch {}
    }, 250).unref?.(); // unref so timer itself doesn't keep process alive

    this._connected$.next(false);
    this.cleanup();
  }

  private cleanup(): void {
    this.closed = true;
    this._connected$.complete();
    this._messages$.complete();
  }
}
