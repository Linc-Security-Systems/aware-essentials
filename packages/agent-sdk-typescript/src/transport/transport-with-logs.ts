import { Transport } from './transport';

export class TransportWithLogs<TIn, TOut, TPeer>
  implements Transport<TIn, TOut, TPeer>
{
  constructor(private readonly decoratee: Transport<TIn, TOut, TPeer>) {
    this.decoratee.connected$.subscribe((connected) => {
      console.log(`[${new Date()}] - Transport connected: ${connected}`);
    });
    this.decoratee.messages$.subscribe((msg) => {
      console.log(
        `[${new Date()}] - Transport message: ${JSON.stringify(msg)}`,
      );
    });
  }

  get connected$() {
    return this.decoratee.connected$;
  }

  get messages$() {
    return this.decoratee.messages$;
  }

  close(): void {
    console.log(`Closing transport`);
    this.decoratee.close();
  }

  send(msg: TOut, to: TPeer | null): void {
    console.log(`[${new Date()}] - Sending message: ${JSON.stringify(msg)}`);
    this.decoratee.send(msg, to);
  }
}
