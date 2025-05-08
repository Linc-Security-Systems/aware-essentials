import {
  of,
  tap,
  mergeMap,
  merge,
  throwError,
  filter,
  take,
  switchMap,
  EMPTY,
  catchError,
  Subscription,
  retry,
  timeout,
  Observable,
  map,
} from 'rxjs';
import { Transport } from './transport';
import {
  AccessControlCapabilityReport,
  FromAgent,
  Message,
  PayloadByKind,
  ProviderSpecs,
  PushEventRq,
  PushStateUpdateRq,
} from '@awarevue/api-types';
import { Agent, RunContext } from './agent';

export type DeviceActivity =
  | Omit<PushStateUpdateRq, 'provider'>
  | Omit<PushEventRq, 'provider'>;

export type AgentOptions = {
  version: number;
  providers: Record<string, ProviderSpecs>;
  accessControlProviders?: Record<string, AccessControlCapabilityReport>;
  agentId: string;
  replyTimeout?: number;
  transport: Transport;
};

export class AgentApp {
  private static id = 0;

  private static nextId = () => `${++AgentApp.id}`;

  private sub: Subscription | null = null;

  // getReply$ is a generic function that sends a message to server and waits for a reply.
  private getReply$ = <TResponseKind extends keyof PayloadByKind>(
    responseKind: TResponseKind,
    payload: FromAgent,
  ) => {
    const reply$ = (id: string) =>
      this.options.transport.messages$.pipe(
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
        timeout(this.options.replyTimeout || 10000),
      ) as Observable<Message<PayloadByKind[TResponseKind]>>;

    return of(this.addEnvelope({ ...payload, id: AgentApp.nextId() })).pipe(
      // send the message to the agent
      tap((p) => this.options.transport.send(p)),
      // wait for the agent to reply
      mergeMap(({ id }) => reply$(id)),
    );
  };

  private addEnvelope = <T extends FromAgent>(payload: T) => ({
    ...payload,
    id: AgentApp.nextId(),
    from: this.options.agentId,
    version: this.options.version,
    on: Date.now(),
  });

  private runProvider$ = (context: RunContext) => {
    return merge(
      // run the agent monitor
      this.agent
        .run$(context)
        .pipe(
          tap((message) =>
            this.options.transport.send(
              this.addEnvelope({ ...message, provider: context.provider }),
            ),
          ),
        ),
      // handle messages to agent
      this.options.transport.messages$.pipe(
        mergeMap((message) => {
          switch (message.kind) {
            // handle commands
            case 'command':
              return this.agent.runCommand$(context, message).pipe(
                // success
                map(() => ({
                  kind: 'command-rs' as const,
                  requestId: message.id,
                })),
                // error
                catchError((error: Error) =>
                  of({
                    kind: 'error-rs' as const,
                    requestId: message.id,
                    error: error.message ?? 'Unknown error',
                  }),
                ),
                // send the response
                tap((rs) => this.options.transport.send(this.addEnvelope(rs))),
              );

            case 'get-available-devices':
              // get available devices
              return this.agent.getDevicesAndRelations$(context).pipe(
                // success
                map((rs) => ({
                  kind: 'get-available-devices-rs' as const,
                  ...rs,
                  requestId: message.id,
                })),
                // error
                catchError((error: Error) =>
                  of({
                    kind: 'error-rs' as const,
                    requestId: message.id,
                    error: error.message ?? 'Unknown error',
                  }),
                ),
                tap((rs) => this.options.transport.send(this.addEnvelope(rs))),
              );

            case 'validate-change':
              // validate access change
              const validateOb$ = !this.agent.validateAccessChange$
                ? throwError(
                    () =>
                      new Error(
                        `Agent ${context.provider} does not support access change validation`,
                      ),
                  )
                : this.agent.validateAccessChange$(context, message);

              return validateOb$.pipe(
                map((issues) => ({
                  kind: 'validate-change-rs' as const,
                  requestId: message.id,
                  issues,
                })),
                catchError((error: Error) =>
                  of({
                    kind: 'error-rs' as const,
                    requestId: message.id,
                    error: error.message ?? 'Unknown error',
                  }),
                ),
                tap((rs) => this.options.transport.send(this.addEnvelope(rs))),
              );

            case 'apply-change':
              // apply access change
              const applyOb$ = !this.agent.applyAccessChange$
                ? throwError(
                    () =>
                      new Error(
                        `Agent ${context.provider} does not support access change application`,
                      ),
                  )
                : this.agent.applyAccessChange$(context, message);
              return applyOb$.pipe(
                map((result) => ({
                  kind: 'apply-change-complete' as const,
                  requestId: message.id,
                  refs: result,
                })),
                catchError((error: Error) =>
                  of({
                    kind: 'error-rs' as const,
                    requestId: message.id,
                    error: error.message ?? 'Unknown error',
                  }),
                ),
                tap((rs) => this.options.transport.send(this.addEnvelope(rs))),
              );

            default:
              return EMPTY;
          }
        }),
      ),
    );
  };

  private process$ = () => {
    const registration$ = this.options.transport.connected$.pipe(
      switchMap((connected) =>
        connected
          ? this.getReply$('register-rs', {
              kind: 'register' as const,
              providers: this.options.providers,
              accessControlProviders: this.options.accessControlProviders,
            }).pipe(retry({ delay: 3000 }))
          : EMPTY,
      ),
    );

    const startStop$ = this.options.transport.messages$.pipe(
      filter((message) => message.kind === 'start' || message.kind === 'stop'),
      switchMap((message) =>
        message.kind === 'start'
          ? merge(
              of({
                provider: message.provider,
                config: message.config,
                lastEventForeignRef: message.lastEventForeignRef,
                lastEventTimestamp: message.lastEventTimestamp,
              }).pipe(mergeMap((context) => this.runProvider$(context))),
              of({
                kind: 'start-rs' as const,
                requestId: message.id,
              }).pipe(
                tap((reply) =>
                  this.options.transport.send(this.addEnvelope(reply)),
                ),
              ),
            )
          : EMPTY,
      ),
    );

    const validateConfig$ = this.options.transport.messages$.pipe(
      filter((message) => message.kind === 'validate-config'),
      mergeMap((message) => {
        const provider = message.provider;
        const config = message.config;
        return this.agent
          .getConfigIssues$({
            provider,
            config,
          })
          .pipe(
            // success
            map((issues) => ({
              kind: 'validate-config-rs' as const,
              requestId: message.id,
              issues,
            })),
            // error
            catchError((error: Error) =>
              of({
                kind: 'error-rs' as const,
                requestId: message.id,
                error: error.message ?? 'Unknown error',
              }),
            ),
            // send the response
            tap((rs) => this.options.transport.send(this.addEnvelope(rs))),
          );
      }),
    );

    return merge(registration$, startStop$, validateConfig$);
  };

  constructor(
    private readonly agent: Agent,
    private readonly options: AgentOptions,
  ) {}

  start() {
    this.sub = this.process$().subscribe();
  }

  stop() {
    this.sub?.unsubscribe();
    this.sub = null;
    this.options.transport.close();
  }
}
