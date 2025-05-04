import { FromAgent, FromServer, Message } from '@awarevue/api-types';
import { Observable } from 'rxjs';

/** What the SDK expects from a transport */
export interface Transport {
  readonly connected$: Observable<boolean>;
  readonly messages$: Observable<Message<FromServer>>;
  readonly errors$: Observable<Error>;
  send(msg: Message<FromAgent>): void;
  close(): void;
}
