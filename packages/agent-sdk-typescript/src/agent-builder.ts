import {
  Observable,
  ObservableInput,
  defer,
  from,
  isObservable,
  of,
  throwError,
} from 'rxjs';
import { Agent, Context, RunCommandContext } from './agent';
import { AnyDeviceCommand, QueryRequestMap, QueryResponseMap } from '@awarevue/api-types';

type HandlerResult<T> = ObservableInput<T> | PromiseLike<T> | T;

type ObservableValue<T extends (...args: any[]) => Observable<unknown>> =
  ReturnType<T> extends Observable<infer R> ? R : never;

type AgentHandler<T extends (...args: any[]) => Observable<unknown>> = (
  ...args: Parameters<T>
) => HandlerResult<ObservableValue<T>>;

type NormalizedHandler<T extends (...args: any[]) => Observable<unknown>> = (
  ...args: Parameters<T>
) => Observable<ObservableValue<T>>;

const toObservable = <T>(result: HandlerResult<T>): Observable<T> => {
  if (isObservable(result)) {
    return result;
  }

  if (result && typeof (result as PromiseLike<T>).then === 'function') {
    return from(result as PromiseLike<T>);
  }

  return of(result as T);
};

const normalizeHandler = <T extends (...args: any[]) => Observable<unknown>>(
  handler: AgentHandler<T>,
): NormalizedHandler<T> => {
  return (...args: Parameters<T>) =>
    defer(() => toObservable(handler(...args)));
};

type QueryHandler<TParams, TResult> = (
  context: Context,
  params: TParams,
) => HandlerResult<TResult>;

type NormalizedQueryHandler = (
  context: Context,
  params: unknown,
) => Observable<unknown>;

type NormalizedUnknownQueryHandler = (
  context: Context,
  query: string,
  params: unknown,
) => Observable<unknown>;

export class AgentBuilder {
  private configIssuesHandler?: NormalizedHandler<Agent['getConfigIssues$']>;
  private runHandler?: NormalizedHandler<Agent['run$']>;
  private runCommandHandler?: NormalizedHandler<Agent['runCommand$']>;
  private validateAccessChangeHandler?: NormalizedHandler<
    NonNullable<Agent['validateAccessChange$']>
  >;
  private applyAccessChangeHandler?: NormalizedHandler<
    NonNullable<Agent['applyAccessChange$']>
  >;
  private findHandler?: NormalizedHandler<NonNullable<Agent['find$']>>;
  private readonly queryHandlers = new Map<string, NormalizedQueryHandler>();
  private readonly commandHandlers = new Map<
    string,
    (context: RunCommandContext, params: unknown) => Observable<unknown>
  >();
  private unknownQueryHandler?: NormalizedUnknownQueryHandler;

  static create() {
    return new AgentBuilder();
  }

  withConfigIssues(handler: AgentHandler<Agent['getConfigIssues$']>): this {
    this.configIssuesHandler = normalizeHandler(handler);
    return this;
  }

  withRun(handler: AgentHandler<Agent['run$']>): this {
    this.runHandler = normalizeHandler(handler);
    return this;
  }

  withCommandRunner(handler: AgentHandler<Agent['runCommand$']>): this {
    this.runCommandHandler = normalizeHandler(handler);
    return this;
  }

  handleCommand<TCommand extends AnyDeviceCommand['command'], TParams extends Devi, TResult>(
    command: string,
    handler: (
      context: RunCommandContext,
      params: TParams,
    ) => HandlerResult<TResult>,
  ): this {
    this.commandHandlers.set(command, (context, params) =>
      defer(() => toObservable(handler(context, params as TParams))),
    );
    return this;
  }

  withAccessChangeValidation(
    handler: AgentHandler<NonNullable<Agent['validateAccessChange$']>>,
  ): this {
    this.validateAccessChangeHandler = normalizeHandler(handler);
    return this;
  }

  withAccessChangeApplication(
    handler: AgentHandler<NonNullable<Agent['applyAccessChange$']>>,
  ): this {
    this.applyAccessChangeHandler = normalizeHandler(handler);
    return this;
  }

  withFinder(handler: AgentHandler<NonNullable<Agent['find$']>>): this {
    this.findHandler = normalizeHandler(handler);
    return this;
  }

  handleQuery<
    TQuery extends keyof QueryRequestMap,
    TParams extends QueryRequestMap[TQuery],
    TResult extends QueryResponseMap[TQuery],
  >(query: TQuery, handler: QueryHandler<TParams, TResult>): this {
    this.queryHandlers.set(query, (context, params) =>
      defer(() => toObservable(handler(context, params as TParams))),
    );
    return this;
  }

  onUnknownQuery(
    handler: (
      context: Context,
      query: string,
      params: unknown,
    ) => HandlerResult<unknown>,
  ): this {
    this.unknownQueryHandler = (context, query, params) =>
      defer(() => toObservable(handler(context, query, params)));
    return this;
  }

  build(): Agent {
    const configIssuesHandler = this.configIssuesHandler;
    if (!configIssuesHandler) {
      throw new Error('Agent requires a config issues handler');
    }

    const runHandler = this.runHandler;
    if (!runHandler) {
      throw new Error('Agent requires a run handler');
    }

    const runCommandHandler = this.runCommandHandler;
    if (!runCommandHandler) {
      throw new Error('Agent requires a command handler');
    }

    const queryHandlers = new Map(this.queryHandlers);
    const unknownQueryHandler = this.unknownQueryHandler;

    const agent: Agent = {
      getConfigIssues$: configIssuesHandler,
      run$: runHandler,
      runCommand$: runCommandHandler,
      query$: (context, query, params) => {
        const handler = queryHandlers.get(query);
        if (handler) {
          return handler(context, params);
        }
        if (unknownQueryHandler) {
          return unknownQueryHandler(context, query, params);
        }
        return throwError(
          () => new Error(`No query handler registered for "${query}"`),
        );
      },
    };

    if (this.validateAccessChangeHandler) {
      agent.validateAccessChange$ = this.validateAccessChangeHandler;
    }

    if (this.applyAccessChangeHandler) {
      agent.applyAccessChange$ = this.applyAccessChangeHandler;
    }

    if (this.findHandler) {
      agent.find$ = this.findHandler;
    }

    return agent;
  }
}

export const createAgentBuilder = () => AgentBuilder.create();
