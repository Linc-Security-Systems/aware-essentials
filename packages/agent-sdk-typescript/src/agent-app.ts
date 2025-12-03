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
  startWith,
  throwIfEmpty,
  delay,
} from 'rxjs';
import { Transport } from './transport';
import {
  AccessRefMap,
  FromAgent,
  PayloadByKind,
  PushEventRq,
  PushStateUpdateRq,
  AccessObjectKind,
  ProviderSpecs,
  AccessControlCapabilityReport,
  AccessValidateChangeRs,
} from '@awarevue/api-types';
import { AccessChangeContext, Agent, RunContext } from './agent';
import { createValidator } from './default-validator';
import { stringifyError } from './utils';
import { AgentError } from './agent-error';

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
                  `Server failed to process message ${payload.kind}: ${error}`,
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
      );

    return of(this.addEnvelope({ ...payload, id: AgentApp.nextId() })).pipe(
      // send the message to the agent
      tap((p) => this.options.transport.send(p)),
      // wait for the agent to reply
      mergeMap(({ id }) => reply$(id)),
    );
  };

  private handleResponse$ =
    (requestId: string) => (obs: Observable<FromAgent>) =>
      obs.pipe(
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
        tap((rs) => this.options.transport.send(this.addEnvelope(rs))),
      );

  private addEnvelope = <T extends FromAgent>(payload: T) => ({
    ...payload,
    id: AgentApp.nextId(),
    from: this.options.agentId,
    version: this.options.version,
    on: Date.now(),
  });

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
          this.options.transport.send(
            this.addEnvelope({
              kind: 'start-rs' as const,
              requestId: context.startRequestId,
            }),
          );
          return of(null).pipe(
            delay(1000),
            mergeMap(() =>
              this.agent.run$(context).pipe(
                tap((message) =>
                  this.options.transport.send(
                    this.addEnvelope({
                      ...message,
                      provider: context.provider,
                    }),
                  ),
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
              // success
              map(() => ({
                kind: 'command-rs' as const,
                requestId: message.id,
              })),
              this.handleResponse$(message.id),
            );

          case 'query':
            if (!this.agent.getResult$) {
              return throwError(
                () =>
                  new AgentError(
                    `Agent ${context.provider} does not support queries`,
                    'NOT_SUPPORTED',
                  ),
              ).pipe(this.handleResponse$(message.id));
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
              map((result) => ({
                kind: 'query-rs' as const,
                requestId: message.id,
                result,
              })),
              this.handleResponse$(message.id),
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
              // success
              map((rs) => ({
                kind: 'get-available-devices-rs' as const,
                ...rs,
                requestId: message.id,
              })),
              this.handleResponse$(message.id),
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
              map((issues) => ({
                kind: 'validate-change-rs' as const,
                requestId: message.id,
                issues,
              })),
              this.handleResponse$(message.id),
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
              map((result) => ({
                kind: 'apply-change-rs' as const,
                requestId: message.id,
                refs: result,
              })),
              this.handleResponse$(message.id),
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
                this.options.transport.send(
                  this.addEnvelope({
                    kind: 'stop-rs' as const,
                    requestId: message.id,
                  }),
                ),
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
            // success
            map((issues) => ({
              kind: 'validate-config-rs' as const,
              requestId: message.id,
              issues,
            })),
            this.handleResponse$(message.id),
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
