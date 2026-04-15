import { catchError, EMPTY, map, Observable } from 'rxjs';
import { DuplexTransport } from '../transport_types';
import { FromAgent, FromServer, Message } from '@awarevue/api-types';

interface WebSocketMessage<TPayload extends object> {
  event: string;
  data: TPayload;
}

export class WsJsonEncoder implements DuplexTransport<
  Message<FromServer | FromAgent>,
  Message<FromAgent | FromServer>
> {
  private defaultDeserializer = (raw: string) => {
    const wsShape = JSON.parse(raw) as WebSocketMessage<object>;
    return {
      kind: wsShape.event,
      ...wsShape.data,
    } as Message<FromServer | FromAgent>;
  };

  private defaultSerializer = (msg: Message<FromAgent | FromServer>) => {
    const { kind, ...data } = msg;
    const wsShape = {
      event: kind,
      data,
    };
    return JSON.stringify(wsShape);
  };

  readonly connected$: Observable<boolean>;
  readonly messages$: Observable<Message<FromServer | FromAgent>>;
  readonly send: (msg: Message<FromAgent | FromServer>) => void;
  readonly close: () => void;

  constructor(decoratee: DuplexTransport<string, string>) {
    this.connected$ = decoratee.connected$;
    this.messages$ = decoratee.messages$.pipe(
      map(
        (raw) =>
          this.defaultDeserializer(raw) as Message<FromServer | FromAgent>,
      ),
      catchError(() => EMPTY), // swallow deserialization errors
    );
    this.send = (msg: Message<FromAgent | FromServer>) =>
      decoratee.send(this.defaultSerializer(msg));
    this.close = () => decoratee.close();
  }
}
