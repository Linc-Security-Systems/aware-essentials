import {
  Message,
  FromServer,
  FromAgent,
  PayloadByKind,
  Unregister,
} from '@awarevue/api-types';
import {
  filter,
  map,
  Observable,
  mergeMap,
  tap,
  throwError,
  of,
  take,
  timeout,
  Subject,
  merge,
} from 'rxjs';
import { Transport } from '../transport/transport';
import { addEnvelope, RoutingTable } from '../utils';
import { v4 } from 'uuid';

export class AgentCommunicationHub<TPeer> {
  private readonly routingTable = new RoutingTable<TPeer, string>();
  private readonly _additionalMessages$ = new Subject<
    readonly [Message<FromAgent>, string]
  >();

  constructor(
    private readonly transport: Transport<
      Message<FromServer | FromAgent>,
      Message<FromServer | FromAgent>,
      TPeer
    >,
    private readonly version: number,
    private readonly hubName: string,
  ) {
    this.connected$ = transport.connected$.pipe(
      map(
        ([connected, peer]) =>
          [connected, this.routingTable.getByUpstream(peer)] as const,
      ),
      filter(([, agentId]) => !!agentId),
      tap(([connected, agentId]) => {
        if (!connected && agentId) {
          this.routingTable.deleteByDownstream(agentId);
          // simulate an unregister message from the agent
          this._additionalMessages$.next([
            {
              kind: 'unregister',
              from: agentId,
              version: this.version,
              id: v4(),
            } as Message<Unregister>,
            agentId,
          ]);
        }
      }),
    );
    this.messages$ = merge(
      this._additionalMessages$,
      transport.messages$.pipe(
        mergeMap(([msg, peer]) => {
          this.routingTable.set(peer, msg.from);
          return [[msg as Message<FromAgent>, msg.from] as const];
        }),
        filter(([, agentId]) => !!agentId),
      ),
    );
  }

  readonly connected$: Observable<readonly [boolean, string]>;
  readonly messages$: Observable<readonly [Message<FromAgent>, string]>;

  send(msg: FromServer, to: string) {
    const withEnvelope = addEnvelope(this.version, this.hubName, msg);
    const peer = this.routingTable.getByDownstream(to);
    if (peer) {
      this.transport.send(withEnvelope, peer);
    } else {
      console.warn(`No transport peer found for agent ${to}`);
    }
  }

  getReply$ = <TResponseKind extends keyof PayloadByKind>(
    to: string,
    responseKind: TResponseKind,
    payload: FromServer,
    timeoutMs = 10000,
  ) => {
    const reply$ = (id: string) =>
      this.messages$.pipe(
        mergeMap(([message, from]) => {
          if (
            from === to &&
            message.kind === 'error-rs' &&
            message.requestId === id
          ) {
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
            message.from === to &&
            message.kind === responseKind &&
            'requestId' in message &&
            message.requestId === id,
        ),
        take(1),
        timeout(timeoutMs),
      ) as Observable<Message<PayloadByKind[TResponseKind]>>;

    return of(addEnvelope(this.version, this.hubName, payload)).pipe(
      // send the message to the agent
      tap((p) => {
        const peer = this.routingTable.getByDownstream(to);
        if (peer) this.transport.send(p, peer);
        else
          console.warn(
            `No transport peer found for agent ${to}, cannot send message`,
          );
      }),
      // wait for the agent to reply
      mergeMap(({ id }) => reply$(id)),
    );
  };

  close() {
    this.transport.close();
  }
}
