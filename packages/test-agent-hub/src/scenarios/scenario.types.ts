import {
  FromAgent,
  FromServer,
  Message,
  PayloadByKind,
  RegisterRq,
} from '@awarevue/api-types';
import {
  AgentProtocol,
  RequestKind,
  Outbound,
  ResponseKind,
} from '@awarevue/agent-sdk';

/* ---------------------------------------------------------------- */
/* Scenario result                                                  */
/* ---------------------------------------------------------------- */

export interface ScenarioResult {
  passed: boolean;
  errors: string[];
  durationMs: number;
}

/** Convenience: build a passing result */
export const scenarioPass = (): Omit<ScenarioResult, 'durationMs'> => ({
  passed: true,
  errors: [],
});

/** Convenience: build a failing result */
export const scenarioFail = (
  ...errors: string[]
): Omit<ScenarioResult, 'durationMs'> => ({
  passed: false,
  errors,
});

/* ---------------------------------------------------------------- */
/* Context handed to each scenario's run()                          */
/* ---------------------------------------------------------------- */

export interface ScenarioContext {
  /** Protocol handle — send messages and await replies from the agent */
  protocol: AgentProtocol<'server'>;

  /** The register payload the agent sent on connect */
  registerPayload: Message<RegisterRq>;

  /** Chosen provider name for this run */
  provider: string;

  /** Provider config to send with start */
  config: Record<string, unknown>;

  /** Collect log lines that appear in the scenario report */
  log(msg: string): void;

  /**
   * Send a request and await the reply (promise version of protocol.getReply$).
   * Automatically handles timeout.
   */
  getReply<K extends RequestKind>(
    payload: Extract<Outbound<'server'>, { kind: K }>,
  ): Promise<PayloadByKind[ResponseKind<K>]>;

  /**
   * Wait for the next inbound message matching a predicate.
   * Resolves with the message or rejects on timeout.
   */
  waitForMessage(
    predicate: (msg: Message<FromAgent>) => boolean,
    timeoutMs?: number,
  ): Promise<Message<FromAgent>>;

  /**
   * Wait for the next inbound message of a given kind.
   */
  waitForKind<K extends FromAgent['kind']>(
    kind: K,
    timeoutMs?: number,
  ): Promise<Message<Extract<FromAgent, { kind: K }>>>;
}

/* ---------------------------------------------------------------- */
/* Scenario definition                                              */
/* ---------------------------------------------------------------- */

export interface Scenario {
  /** Short unique name (used in reports) */
  name: string;

  /** Human-readable description */
  description: string;

  /** Tags used for filtering (e.g. ['core', 'lifecycle']) */
  tags: string[];

  /**
   * Run the scenario.
   * Return `scenarioPass()` / `scenarioFail(...)` or throw.
   */
  run(ctx: ScenarioContext): Promise<Omit<ScenarioResult, 'durationMs'>>;
}
