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
  Observable,
  map,
  startWith,
  throwIfEmpty,
  delay,
} from 'rxjs';
import {
  AccessRefMap,
  FromAgent,
  PushEventRq,
  PushStateUpdateRq,
  AccessObjectKind,
  ProviderSpecs,
  AccessControlCapabilityReport,
  AccessValidateChangeRs,
  FromServer,
  Message,
} from '@awarevue/api-types';
import { AccessChangeContext, Agent, RunContext } from './agent';
import { createValidator } from './default-validator';
import { stringifyError } from './utils';
import { AgentError, AgentProgressMessage } from './agent-error';
import { DuplexTransport } from './transport_types';
import { AgentProtocol } from './agent-protocol';

type ObjectCache = Record<
  AccessObjectKind,
  Record<string, Record<string, unknown>>
>;

export type DeviceActivity =
  | Omit<PushStateUpdateRq, 'provider'>
  | Omit<PushEventRq, 'provider'>;

export type AgentOptions = {
  providers: Record<string, ProviderSpecs>;
  accessControlProviders?: Record<string, AccessControlCapabilityReport>;
  agentId: string;
  replyTimeout?: number;
  transport: DuplexTransport<Message<FromServer>, Message<FromAgent>>;
};

export class AgentApp {
  private readonly protocol: AgentProtocol<'agent'>;

  private sub: Subscription | null = null;

  private handleResponse$ =
    <T>(requestId: string, responseBuilder?: (result: T) => FromAgent) =>
    (obs: Observable<T>) =>
      obs.pipe(
        mergeMap((result) =>
          result instanceof AgentProgressMessage
            ? of({
                kind: 'progress' as const,
                requestId,
                message: result.message,
              })
            : responseBuilder
              ? of(responseBuilder(result))
              : EMPTY,
        ),
        tap({
          error: (error) =>
            console.error(
              'Error processing request',
              requestId,
              stringifyError(error),
            ),
        }),
        catchError((error: unknown) =>
          of({
            kind: 'error-rs' as const,
            requestId,
            error: stringifyError(error),
            code: error instanceof AgentError ? error.code : undefined,
          }),
        ),
        tap((rs) => this.protocol.send(rs)),
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

  private runProvider$ = (context: RunContext & { startRequestId: string }) => {
    const changeValidator$ = createValidator(this.agent);
    // we assume that there will be only one validate-apply cycle per agent at the same time
    let objectCache: ObjectCache = {
      person: {},
      accessRule: {},
      schedule: {},
      device: {},
      zone: {},
    };

    return this.options.transport.messages$.pipe(
      startWith(null), // emit immediately to ensure subscription is active
      mergeMap((message) => {
        // Send start-rs on the first emission (null) to signal we're ready
        if (message === null) {
          this.protocol.send({
            kind: 'start-rs' as const,
            requestId: context.startRequestId,
          });
          return of(null).pipe(
            delay(1000),
            mergeMap(() =>
              this.agent.run$(context).pipe(
                tap((message) =>
                  this.protocol.send({
                    ...message,
                    provider: context.provider,
                  }),
                ),
              ),
            ),
          );
        }

        switch (message.kind) {
          // handle commands
          case 'command':
            return this.agent.runCommand$(context, message).pipe(
              // if command observable completes without emitting, throw not supported error
              throwIfEmpty(
                () =>
                  new AgentError(
                    `Agent ${context.provider} does not support command ${message.command}`,
                    'NOT_SUPPORTED',
                  ),
              ),
              this.handleResponse$(message.id, (result) => ({
                kind: 'command-rs' as const,
                requestId: message.id,
                result,
              })),
            );

          case 'query':
            if (!this.agent.getResult$) {
              return throwError(
                () =>
                  new AgentError(
                    `Agent ${context.provider} does not support queries`,
                    'NOT_SUPPORTED',
                  ),
              ).pipe(
                this.handleResponse$(message.id, (result) => ({
                  kind: 'query-rs' as const,
                  requestId: message.id,
                  result,
                })),
              );
            }
            return this.agent.getResult$(context, message).pipe(
              // if query observable completes without emitting, throw not supported error
              throwIfEmpty(
                () =>
                  new AgentError(
                    `Agent ${context.provider} does not support query ${message.query}`,
                    'NOT_SUPPORTED',
                  ),
              ),
              // success
              this.handleResponse$(message.id, (result) => ({
                kind: 'query-rs' as const,
                requestId: message.id,
                result,
              })),
            );

          case 'push-file':
            if (!this.agent.pushFile) {
              return throwError(
                () =>
                  new AgentError(
                    `Agent ${context.provider} does not support file pushing`,
                    'NOT_SUPPORTED',
                  ),
              );
            }
            return this.agent.pushFile(context, message).pipe(
              // success - no return value
              mergeMap(() => EMPTY),
              this.handleResponse$(message.id),
            );

          case 'get-available-devices':
            // get available devices
            return this.agent.getDevicesAndRelations$(context).pipe(
              this.handleResponse$(message.id, (result) => ({
                ...result,
                kind: 'get-available-devices-rs' as const,
                requestId: message.id,
              })),
            );

          case 'validate-change':
            let validateOb$: Observable<AccessValidateChangeRs['issues']> =
              throwError(
                () =>
                  new AgentError(
                    `Agent ${context.provider} does not support access change validation`,
                    'NOT_SUPPORTED',
                  ),
              );
            if (this.agent.validateAccessChange$) {
              const v$ = this.agent.validateAccessChange$;
              // validate access change
              validateOb$ = changeValidator$(context, message).pipe(
                mergeMap(([issues, cache]) => {
                  objectCache = cache;
                  const validationContext = this.createAccessChangeContext(
                    context,
                    message.refMap,
                    objectCache,
                  );
                  return issues.length > 0
                    ? of(issues)
                    : v$(validationContext, message);
                }),
              );
            }

            return validateOb$.pipe(
              this.handleResponse$(message.id, (result) => ({
                kind: 'validate-change-rs' as const,
                requestId: message.id,
                issues: result,
              })),
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
                    new AgentError(
                      `Agent ${context.provider} does not support access change apply`,
                      'NOT_SUPPORTED',
                    ),
                )
              : this.agent.applyAccessChange$(applyContext, message);
            return applyOb$.pipe(
              this.handleResponse$(message.id, (result) => ({
                kind: 'apply-change-rs' as const,
                requestId: message.id,
                refs: result,
              })),
            );

          default:
            return EMPTY;
        }
      }),
    );
  };

  private process$ = () => {
    const registration$ = this.options.transport.connected$.pipe(
      switchMap((connected) =>
        connected
          ? this.protocol
              .getReply$({
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
                map((deviceCatalog) => ({
                  provider: message.provider,
                  config: message.config,
                  lastEventForeignRef: message.lastEventForeignRef,
                  lastEventTimestamp:
                    message.lastEventTimestamp === null
                      ? null
                      : Math.min(Date.now(), message.lastEventTimestamp),
                  deviceCatalog,
                  startRequestId: message.id,
                })),
                mergeMap((context) => this.runProvider$(context)),
              )
          : of(message).pipe(
              tap(() =>
                this.protocol.send({
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
        const provider = message.provider;
        const config = message.config;
        return this.agent
          .getConfigIssues$({
            provider,
            config,
          })
          .pipe(
            this.handleResponse$(message.id, (result) => ({
              kind: 'validate-config-rs' as const,
              requestId: message.id,
              issues: result,
            })),
          );
      }),
    );

    return merge(registration$, startStop$, validateConfig$);
  };

  constructor(
    private readonly agent: Agent,
    private readonly options: AgentOptions,
  ) {
    this.protocol = new AgentProtocol<'agent'>(this.options.transport, {
      id: this.options.agentId,
      replyTimeout: this.options.replyTimeout,
    });
  }

  start() {
    this.sub = this.process$().subscribe();
  }

  stop() {
    this.sub?.unsubscribe();
    this.sub = null;
    this.options.transport.close();
  }
}
