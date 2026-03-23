// transports/logging.ts
// ----------------------------------------------------------------
// Logging decorator for DuplexTransport.
// Wraps any DuplexTransport and prints inbound / outbound messages.
// ----------------------------------------------------------------

import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { DuplexTransport } from '../transport_types';

/* ---------------------------------------------------------------- */
/* Options                                                          */
/* ---------------------------------------------------------------- */

export interface LoggingTransportOptions {
  /**
   * Label prepended to each log line so multiple transports can be
   * distinguished in the same process (default: `'transport'`).
   */
  label?: string;

  /**
   * Custom log sink.  When omitted, messages are written to
   * `console.log` as pretty-printed JSON.
   */
  logger?: (direction: 'IN' | 'OUT', label: string, msg: unknown) => void;
}

/* ---------------------------------------------------------------- */
/* Implementation                                                   */
/* ---------------------------------------------------------------- */

export class LoggingDuplexTransport<TIn, TOut>
  implements DuplexTransport<TIn, TOut>
{
  readonly connected$: Observable<boolean>;
  readonly messages$: Observable<TIn>;

  private readonly label: string;
  private readonly sink: (
    direction: 'IN' | 'OUT',
    label: string,
    msg: unknown,
  ) => void;

  constructor(
    private readonly inner: DuplexTransport<TIn, TOut>,
    opts: LoggingTransportOptions = {},
  ) {
    this.label = opts.label ?? 'transport';
    this.sink =
      opts.logger ??
      ((direction, label, msg) =>
        console.log(`[${label}] ${direction}`, JSON.stringify(msg, null, 2)));

    this.connected$ = inner.connected$;

    // Tap into the incoming stream before exposing it to consumers.
    this.messages$ = inner.messages$.pipe(
      tap((msg) => this.sink('IN', this.label, msg)),
    );
  }

  send(msg: TOut): void {
    this.sink('OUT', this.label, msg);
    this.inner.send(msg);
  }

  close(): void {
    this.inner.close();
  }
}
