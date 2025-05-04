import { Message, FromAgent } from '@awarevue/api-types';
import { Transport } from './transport';

export class TransportWithLogs implements Transport {
  constructor(private readonly decoratee: Transport) {
    this.decoratee.connected$.subscribe((connected) => {
      console.log(`[${new Date()}] - Transport connected: ${connected}`);
    });
    this.decoratee.messages$.subscribe((msg) => {
      console.log(
        `[${new Date()}] - Transport message: ${JSON.stringify(msg)}`,
      );
    });
    this.decoratee.errors$.subscribe((err) => {
      console.error(`[${new Date()}] - Transport error: ${err}`);
    });
  }

  get connected$() {
    return this.decoratee.connected$;
  }

  get messages$() {
    return this.decoratee.messages$;
  }

  get errors$() {
    return this.decoratee.errors$;
  }

  close(): void {
    console.log(`Closing transport`);
    this.decoratee.close();
  }

  send(msg: Message<FromAgent>): void {
    console.log(`[${new Date()}] - Sending message: ${JSON.stringify(msg)}`);
    this.decoratee.send(msg);
  }
}
