import {
  FromAgent,
  FromServer,
  Message,
  PayloadByKind,
  ReplyKindByRequestKind,
} from '@awarevue/api-types';
import { DuplexTransport } from './transport_types';
import {
  mergeMap,
  throwError,
  of,
  filter,
  take,
  timeout,
  tap,
  Observable,
} from 'rxjs';
import { AGENT_PROTOCOL_VERSION } from './constants';

export type Direction = 'server' | 'agent';

export type RequestKind = keyof typeof ReplyKindByRequestKind;
export type ResponseKind<K extends RequestKind> =
  (typeof ReplyKindByRequestKind)[K];

/**
 * Directional wire types:
 * - If you are SERVER: you receive FromAgent, send FromServer
 * - If you are AGENT:  you receive FromServer, send FromAgent
 */
export type Inbound<D extends Direction> = D extends 'server'
  ? FromAgent
  : FromServer;

export type Outbound<D extends Direction> = D extends 'server'
  ? FromServer
  : FromAgent;

export type InMsg<D extends Direction> = Message<Inbound<D>>;
export type OutMsg<D extends Direction> = Message<Outbound<D>>;

export interface AgentProtocolOptions {
  /** Timeout for awaiting replies to sent messages (default 10s) */
  replyTimeout?: number;
  id: string;
}

export class AgentProtocol<D extends Direction> {
  private static id = 0;

  private static nextId = () => `${++AgentProtocol.id}`;

  private addEnvelope = <T extends Outbound<D>>(payload: T): Message<T> => ({
    ...payload,
    id: AgentProtocol.nextId(),
    from: this.options.id,
    version: AGENT_PROTOCOL_VERSION,
    on: Date.now(),
  });

  constructor(
    private readonly transport: DuplexTransport<
      Message<Inbound<D>>,
      Message<Outbound<D>>
    >,
    private readonly options: AgentProtocolOptions,
  ) {}

  getReply$ = <K extends RequestKind>(
    payload: Extract<Outbound<D>, { kind: K }>,
    timeoutMs?: number,
  ) => {
    const responseKind = ReplyKindByRequestKind[
      payload.kind
    ] as ResponseKind<K>;

    const reply$ = (id: string) =>
      this.transport.messages$.pipe(
        // pass through only messages with matching requestId (it could be response, error or progress update)
        filter((message) => 'requestId' in message && message.requestId === id),
        mergeMap((message) => {
          // if the agent responded with an error message related to our request, throw an error to fail the stream
          if (message.kind === 'error-rs') {
            const error = message.error;
            return throwError(
              () =>
                new Error(
                  `Server failed to process message ${payload.kind}: ${error}`,
                ),
            );
          }
          return of(message);
        }),
        // enforce timeout (progress updates will reset the timer, but if no messages arrive for `timeoutMs` duration, the request is considered failed)
        timeout(timeoutMs || this.options.replyTimeout || 10000),
        // pass through only the final response message (filter out progress updates)
        filter((message) => message.kind === responseKind),
        // we only expect one response message, so complete the stream after the response arrives
        take(1),
      ) as Observable<Message<PayloadByKind[typeof responseKind]>>;

    return of(
      this.addEnvelope({ ...payload, id: AgentProtocol.nextId() }),
    ).pipe(
      // send the message to the agent
      tap((p) => this.transport.send(p)),
      // wait for the agent to reply
      mergeMap(({ id }) => reply$(id)),
    );
  };

  send = (payload: Outbound<D>) => {
    const message = this.addEnvelope(payload);
    this.transport.send(message);
  };
}
