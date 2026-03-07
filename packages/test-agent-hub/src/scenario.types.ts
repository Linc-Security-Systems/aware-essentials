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
/* Device state store                                               */
/* ---------------------------------------------------------------- */

/** Accumulated state for a single device, keyed by property name. */
export type DeviceState = Record<string, unknown>;

/**
 * Reduces incoming `state` messages from the agent into accumulated
 * per-device state maps. Provides query, wait, and assertion helpers
 * so scenarios can verify that the agent reports expected device states.
 *
 * A fresh store is created for each scenario — it only contains state
 * received during that scenario's execution.
 */
export interface DeviceStateStore {
  /* ---- Observe ------------------------------------------------- */

  /** Get the current accumulated state for a device, or `undefined` if the agent hasn't reported any. */
  get(foreignRef: string): DeviceState | undefined;

  /** Get all accumulated device states reported by the agent so far. */
  getAll(): ReadonlyMap<string, DeviceState>;

  /** Whether the agent has reported any state for this device. */
  has(foreignRef: string): boolean;

  /* ---- Wait ---------------------------------------------------- */

  /**
   * Resolves when the accumulated state for `foreignRef` satisfies `predicate`.
   * Checks the current state first — resolves immediately if already satisfied.
   * Otherwise waits for future state updates from the agent.
   */
  waitUntil(
    foreignRef: string,
    predicate: (state: DeviceState) => boolean,
    timeoutMs?: number,
  ): Promise<DeviceState>;

  /**
   * Resolves on the **next** state update the agent sends for `foreignRef`,
   * regardless of current state. Useful after sending a command — "wait for
   * the agent to report the resulting state change."
   */
  waitForChange(
    foreignRef: string,
    timeoutMs?: number,
  ): Promise<DeviceState>;

  /**
   * Multi-device variant of `waitUntil`. Resolves when **every** listed device
   * has accumulated state satisfying `predicate`.
   */
  waitForDevices(
    foreignRefs: string[],
    predicate: (state: DeviceState) => boolean,
    timeoutMs?: number,
  ): Promise<Map<string, DeviceState>>;

  /* ---- Assert -------------------------------------------------- */

  /**
   * Like `waitUntil`, but on timeout throws a descriptive error containing
   * `message` and a snapshot of the device's current state (or "no state received").
   * Use as an assertion: the scenario fails with a clear diagnostic if the agent
   * doesn't report the expected state in time.
   */
  assertState(
    foreignRef: string,
    predicate: (state: DeviceState) => boolean,
    message: string,
    timeoutMs?: number,
  ): Promise<void>;
}

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

  /**
   * Accumulated device state reported by the agent via `state` messages.
   * Provides query, wait, and assertion helpers.
   * Fresh instance per scenario — only contains state from this scenario's run.
   */
  deviceState: DeviceStateStore;

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

  waitForSomeMessages(
    predicate: (msg: Message<FromAgent>) => boolean,
    timeoutMs?: number,
  ): Promise<Message<FromAgent>[]>;

  waitForAllMessages(
    predicates: ((msg: Message<FromAgent>) => boolean)[],
    timeoutMs?: number,
  ): Promise<Message<FromAgent>[]>;

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
