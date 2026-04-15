import {
  FromAgent,
  FromServer,
  getAgentMessageIssues,
  isMessageFromAgent,
  Message,
  RegisterRq,
  StartServiceRq,
} from '@awarevue/api-types';
import { HubTransport, PeerId } from './transport_types';
import { AgentProtocol } from './agent-protocol';
import { filter, map, merge, Subject, Subscription, tap } from 'rxjs';
import { AGENT_PROTOCOL_VERSION } from './constants';

export interface OnUnregisteredEventArgs {
  agentId: string;
  reason?: string;
}

export type OnRegisterEventArgs = {
  agentId: string;
  accept: () => void;
  reject: (reason: string) => void;
} & Omit<RegisterRq, 'kind'>;

export type OnStoppedEventArgs = {
  agentId: string;
};

export type OnStartedEventArgs = {
  agentId: string;
};

export type StartAgentArgs = {
  agentId: string;
} & Omit<StartServiceRq, 'kind'>;

export type AgentServerOptions = {
  /** Timeout for awaiting replies to sent messages (default 10s) */
  replyTimeout?: number;
  onRegister?: (args: OnRegisterEventArgs) => void;
  onUnregistered?: (args: OnUnregisteredEventArgs) => void;
  onStarted?: (args: OnStartedEventArgs) => void;
  onStopped?: (args: OnStoppedEventArgs) => void;
};

export class AgentServer<TPeer extends PeerId = string> {
  readonly notifications$ = new Subject<string>();

  readonly messages$ = new Subject<{
    msg: Message<FromAgent>;
    peer: TPeer;
    agentId: string;
  }>();

  private sub: Subscription | null = null;

  private readonly _agentToPeer = new Map<string, TPeer>();
  private readonly _peerToAgent = new Map<TPeer, string>();

  constructor(
    private readonly hub: HubTransport<
      Message<FromAgent>,
      Message<FromServer>,
      TPeer
    >,
    private readonly options: AgentServerOptions = {},
  ) {}

  init() {
    if (this.sub) {
      return;
    }

    const processMessages$ = this.hub.messages$.pipe(
      // validate
      map(({ msg, peer }) => ({ msg, peer, isValid: isMessageFromAgent(msg) })),
      tap(({ msg, peer, isValid }) => {
        const id = msg.id ?? 'unknown';
        if (msg.version !== AGENT_PROTOCOL_VERSION) {
          this.notifications$.next(
            `Agent ${msg.from} has incompatible protocol version: ${msg.version}`,
          );
          const protocol = this.getPeerSender(peer);
          protocol?.send({
            kind: 'error-rs',
            requestId: id,
            error: `Incompatible protocol version. Expected ${AGENT_PROTOCOL_VERSION} but got ${msg.version}`,
          });
        } else if (!isValid) {
          // log
          const issues = getAgentMessageIssues(msg).join(', ');
          this.notifications$.next(
            `Received invalid message from agent ${peer}: ${issues}`,
          );
          const sender = this.getPeerSender(peer);
          sender?.send({
            kind: 'error-rs',
            requestId: id,
            error: issues,
          });
          return;
        }
      }),
      // dismiss invalid protocol messages
      filter(
        ({ msg, isValid }) => msg.version === AGENT_PROTOCOL_VERSION && isValid,
      ),
      // forward valid messages to the messages$ stream
      tap((m) => {
        const agentId = m.msg.from;

        // if this is a registration message, establish the agentId ↔ peer mapping
        if (m.msg.kind === 'register') {
          this._agentToPeer.set(agentId, m.peer);
          this._peerToAgent.set(m.peer, agentId);

          this.messages$.next({ ...m, agentId });

          this.options.onRegister?.({
            ...m.msg,
            agentId,
            reject: (reason) => {
              const protocol = this.getPeerSender(m.peer);
              protocol?.send({
                kind: 'error-rs',
                requestId: m.msg.id,
                error: reason,
              });
              this._agentToPeer.delete(agentId);
              this._peerToAgent.delete(m.peer);
            },
            accept: () => {
              const protocol = this.getPeerSender(m.peer);
              protocol?.send({
                kind: 'register-rs',
                requestId: m.msg.id,
              });
            },
          });
        } else {
          this.messages$.next({ ...m, agentId });

          if (m.msg.kind === 'start-rs') {
            this.options.onStarted?.({ agentId });
          } else if (m.msg.kind === 'stop-rs') {
            this.options.onStopped?.({ agentId });
          }
        }
      }),
    );

    const processConnections$ = this.hub.peerEvents$.pipe(
      filter((event) => event.type === 'leave'),
      tap(({ peer, reason }) => {
        const agentId = this._peerToAgent.get(peer);
        this.notifications$.next(
          `Peer ${peer}${agentId ? ` (agent: ${agentId})` : ''} left: ${reason ?? 'unknown reason'}`,
        );
        // clean up maps
        if (agentId) {
          this._peerToAgent.delete(peer);
          this._agentToPeer.delete(agentId);
          this.options.onUnregistered?.({
            agentId,
            reason: reason as string,
          });
        }
      }),
    );

    this.sub = merge(processMessages$, processConnections$).subscribe();
  }

  startAgent({ agentId, ...rest }: StartAgentArgs) {
    const protocol = this.getAgentSender(agentId);
    protocol?.send({ kind: 'start', ...rest });
  }

  stopAgent(agentId: string, provider: string) {
    const protocol = this.getAgentSender(agentId);
    protocol?.send({ kind: 'stop', provider });
  }

  finalize() {
    this.sub?.unsubscribe();
    this.sub = null;
    this._agentToPeer.clear();
    this._peerToAgent.clear();
  }

  getAgentSender(agentId: string): AgentProtocol<'server'> | null {
    const peer = this._agentToPeer.get(agentId);
    if (peer === undefined) return null;
    return this.getPeerSender(peer);
  }

  private getPeerSender(peer: TPeer): AgentProtocol<'server'> | null {
    const connection = this.hub.connection(peer);
    if (!connection) {
      return null;
    }
    const agentId = this._peerToAgent.get(peer) ?? `${peer}`;
    return new AgentProtocol<'server'>(connection, {
      replyTimeout: this.options.replyTimeout,
      id: agentId,
    });
  }
}
