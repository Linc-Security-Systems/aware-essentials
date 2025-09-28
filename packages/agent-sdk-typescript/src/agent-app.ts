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
  Observable,
} from 'rxjs';
import {
  AccessObjectKind,
  AccessRefMap,
  AgentServices,
  DeviceGraphResponse,
  FromAgent,
  ProviderSpecs,
  PushEventRq,
  PushStateUpdateRq,
  QUERY_DEVICE_GRAPH,
} from '@awarevue/api-types';
import { AccessChangeContext, Agent, RunContext } from './agent';
import { createValidator } from './default-validator';
import { AgentCommunicationClient } from './agent-protocol/agent-communication-client';

const stringifyError = (error: unknown) => {
  if (error instanceof Error) {
    return `\nMessage: ${error.message}\nStack: ${error.stack}`;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

type ObjectCache = Record<
  AccessObjectKind,
  Record<string, Record<string, unknown>>
>;

export type DeviceActivity =
  | Omit<PushStateUpdateRq, 'provider'>
  | Omit<PushEventRq, 'provider'>;

export type AgentOptions = {
  version: number;
  provider: string;
  metadata: ProviderSpecs;
  agentId: string;
  services: AgentServices;
  replyTimeout?: number;
  client: AgentCommunicationClient<unknown>;
};

export class AgentApp {
  private sub: Subscription | null = null;

  private handleResponse$ =
    (requestId: string, requestKind: string) => (obs: Observable<FromAgent>) =>
      obs.pipe(
        tap({
          error: (error) =>
            console.error(
              'Error processing request',
              requestKind,
              requestId,
              stringifyError(error),
            ),
        }),
        catchError((error: unknown) =>
          of({
            kind: 'error-rs' as const,
            requestId,
            error: stringifyError(error),
          }),
        ),
        tap((rs) => this.options.client.send(rs)),
      );

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
          this.options.client.send({
            ...message,
            provider: context.provider,
          }),
        ),
      ),
      // handle messages to agent
      this.options.client.messages$.pipe(
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
                this.handleResponse$(message.id, message.kind),
              );

            case 'query':
              // get available devices
              return this.agent
                .query$(context, message.query, message.args)
                .pipe(
                  // successful
                  map((rs) => ({
                    kind: 'query-rs' as const,
                    result: rs,
                    requestId: message.id,
                  })),
                  this.handleResponse$(message.id, message.kind),
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
                this.handleResponse$(message.id, message.kind),
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
                        `Agent ${context.provider} does not support access change apply`,
                      ),
                  )
                : this.agent.applyAccessChange$(applyContext, message);
              return applyOb$.pipe(
                map((result) => ({
                  kind: 'apply-change-rs' as const,
                  requestId: message.id,
                  refs: result,
                })),
                this.handleResponse$(message.id, message.kind),
              );

            default:
              return EMPTY;
          }
        }),
      ),
    );
  };

  private process$ = () => {
    const registration$ = this.options.client.connected$.pipe(
      switchMap((connected) =>
        connected
          ? this.options.client
              .getReply$(
                'register-rs',
                {
                  kind: 'register' as const,
                  provider: this.options.provider,
                  metadata: this.options.metadata,
                  services: this.options.services,
                },
                this.options.replyTimeout || 10000,
              )
              .pipe(retry({ delay: 3000 }))
          : EMPTY,
      ),
    );

    const startStop$ = this.options.client.messages$.pipe(
      filter((message) => message.kind === 'start' || message.kind === 'stop'),
      switchMap((message) =>
        message.kind === 'start'
          ? this.agent
              .query$(
                {
                  provider: message.provider,
                  config: message.config,
                },
                QUERY_DEVICE_GRAPH,
                {},
              )
              .pipe(
                retry({ delay: 3000 }),
                tap(() => {
                  // reply to server that we are starting
                  this.options.client.send({
                    kind: 'start-rs' as const,
                    requestId: message.id,
                  });
                }),
                map((deviceCatalog: DeviceGraphResponse) => ({
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
                this.options.client.send({
                  kind: 'stop-rs' as const,
                  requestId: message.id,
                }),
              ),
            ),
      ),
    );

    const validateConfig$ = this.options.client.messages$.pipe(
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
            this.handleResponse$(message.id, message.kind),
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
    this.options.client.close();
  }
}
