import {
  FromAgent,
  FromServer,
  Message,
  PayloadByKind,
} from '@awarevue/api-types';
import { Transport } from '../transport/transport';
import {
  filter,
  map,
  mergeMap,
  Observable,
  of,
  take,
  tap,
  throwError,
  timeout,
} from 'rxjs';
import { addEnvelope } from '../utils';

/** agents use this class to communicate to server (agent hub) */
export class AgentCommunicationClient<TPeer> {
  constructor(
    private readonly transport: Transport<
      Message<FromServer | FromAgent>,
      Message<FromServer | FromAgent>,
      TPeer
    >,
    private readonly agentId: string,
    private readonly version: number,
  ) {
    this.connected$ = transport.connected$.pipe(
      map(([connected]) => connected),
    );
    this.messages$ = transport.messages$.pipe(
      map(([msg]) => msg as Message<FromServer>),
    );
  }

  readonly connected$: Observable<boolean>;
  readonly messages$: Observable<Message<FromServer>>;

  send(msg: FromAgent) {
    const withEnvelope = addEnvelope(this.version, this.agentId, msg);
    this.transport.send(withEnvelope, null);
  }

  getReply$ = <TResponseKind extends keyof PayloadByKind>(
    responseKind: TResponseKind,
    payload: FromAgent,
    timeoutMs: number,
  ) => {
    const reply$ = (id: string) =>
      this.messages$.pipe(
        mergeMap((message) => {
          if (message.kind === 'error-rs' && message.requestId === id) {
            const error = message.error;
            return throwError(
              () =>
                new Error(
                  `Server failed to process message ${message.kind}: ${error}`,
                ),
            );
          }
          return of(message);
        }),
        filter(
          (message) =>
            message.kind === responseKind &&
            'requestId' in message &&
            message.requestId === id,
        ),
        take(1),
        timeout(timeoutMs),
      ) as Observable<Message<PayloadByKind[TResponseKind]>>;

    return of(addEnvelope(this.version, this.agentId, payload)).pipe(
      // send the message to the agent
      tap((p) => this.transport.send(p, null)),
      // wait for the agent to reply
      mergeMap(({ id }) => reply$(id)),
    );
  };

  close() {
    this.transport.close();
  }
}
