import {
  of,
  tap,
  mergeMap,
  merge,
  throwError,
  filter,
  switchMap,
  EMPTY,
  catchError,
  Subscription,
  retry,
  map,
} from 'rxjs';
import {
  AccessControlCapabilityReport,
  AccessObjectKind,
  AccessRefMap,
  ProviderSpecs,
  PushEventRq,
  PushStateUpdateRq,
} from '@awarevue/api-types';
import { AccessChangeContext, Agent, RunContext } from './agent';
import { createValidator } from './default-validator';
import { AgentCommunicationClient } from './agent-protocol/agent-communication-client';

type ObjectCache = Record<
  AccessObjectKind,
  Record<string, Record<string, unknown>>
>;

export type DeviceActivity =
  | Omit<PushStateUpdateRq, 'provider'>
  | Omit<PushEventRq, 'provider'>;

export type AgentOptions = {
  version: number;
  providers: Record<string, ProviderSpecs>;
  accessControlProviders?: Record<string, AccessControlCapabilityReport>;
  agentId: string;
  replyTimeout?: number;
  transport: AgentCommunicationClient<unknown>;
};

export class AgentApp {
  private sub: Subscription | null = null;

  private createAccessChangeContext = (
    context: RunContext,
    refMap: AccessRefMap,
    objectCache: ObjectCache,
  ): AccessChangeContext => {
    return {
      ...context,
      objectsById: <T>(objectKind: AccessObjectKind, objectId: string) => {
        const objectKindRefs = refMap[objectKind] || {};
        const refs = objectKindRefs[objectId] || [];
        return refs.flatMap((foreignRef) => {
          const value = objectCache[objectKind][foreignRef];
          return value ? [value as T] : ([] as T[]);
        });
      },
      objectByForeignRef: <T>(
        objectKind: AccessObjectKind,
        foreignRef: string,
      ) => {
        return (objectCache[objectKind][foreignRef] as T) || null;
      },
    };
  };

  private runProvider$ = (context: RunContext) => {
    const changeValidator$ = createValidator(this.agent);
    // we assume that there will be only one validate-apply cycle per agent at the same time
    let objectCache: ObjectCache = {
      person: {},
      accessRule: {},
      schedule: {},
      device: {},
      zone: {},
    };

    return merge(
      // run the agent monitor
      this.agent.run$(context).pipe(
        tap((message) =>
          this.options.transport.send({
            ...message,
            provider: context.provider,
          }),
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
                tap((rs) => this.options.transport.send(rs)),
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
                tap((rs) => this.options.transport.send(rs)),
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
                : changeValidator$(context, message).pipe(
                    mergeMap(([issues, cache]) => {
                      objectCache = cache;
                      const validationContext = this.createAccessChangeContext(
                        context,
                        message.refMap,
                        objectCache,
                      );
                      return issues.length > 0
                        ? of(issues)
                        : this.agent.validateAccessChange$(
                            validationContext,
                            message,
                          );
                    }),
                  );

              return validateOb$.pipe(
                map((issues) => ({
                  kind: 'validate-change-rs' as const,
                  requestId: message.id,
                  issues,
                })),
                tap({
                  error: (error) => {
                    // print error
                    console.error(error);
                  },
                }),
                catchError((error: Error) =>
                  of({
                    kind: 'error-rs' as const,
                    requestId: message.id,
                    error: error.message ?? 'Unknown error',
                  }),
                ),
                tap((rs) => this.options.transport.send(rs)),
              );

            case 'apply-change':
              // apply access change
              const applyContext = this.createAccessChangeContext(
                context,
                message.refMap,
                objectCache,
              );
              const applyOb$ = !this.agent.applyAccessChange$
                ? throwError(
                    () =>
                      new Error(
                        `Agent ${context.provider} does not support access change application`,
                      ),
                  )
                : this.agent.applyAccessChange$(applyContext, message);
              return applyOb$.pipe(
                map((result) => ({
                  kind: 'apply-change-rs' as const,
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
                tap((rs) => this.options.transport.send(rs)),
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
          ? this.options.transport
              .getReply$('register-rs', {
                kind: 'register' as const,
                providers: this.options.providers,
                accessControlProviders: this.options.accessControlProviders,
              })
              .pipe(retry({ delay: 3000 }))
          : EMPTY,
      ),
    );

    const startStop$ = this.options.transport.messages$.pipe(
      filter((message) => message.kind === 'start' || message.kind === 'stop'),
      switchMap((message) =>
        message.kind === 'start'
          ? this.agent
              .getDevicesAndRelations$({
                provider: message.provider,
                config: message.config,
              })
              .pipe(
                retry({ delay: 3000 }),
                tap(() => {
                  // reply to server that we are starting
                  this.options.transport.send({
                    kind: 'start-rs' as const,
                    requestId: message.id,
                  });
                }),
                map((deviceCatalog) => ({
                  provider: message.provider,
                  config: message.config,
                  lastEventForeignRef: message.lastEventForeignRef,
                  lastEventTimestamp: message.lastEventTimestamp,
                  deviceCatalog,
                })),
                mergeMap((context) => this.runProvider$(context)),
              )
          : of(message).pipe(
              tap(() =>
                this.options.transport.send({
                  kind: 'stop-rs' as const,
                  requestId: message.id,
                }),
              ),
            ),
      ),
    );

    const validateConfig$ = this.options.transport.messages$.pipe(
      filter((message) => message.kind === 'validate-config'),
      mergeMap((message) => {
        if (message.kind !== 'validate-config') {
          return EMPTY;
        }
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
            tap((rs) => this.options.transport.send(rs)),
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
