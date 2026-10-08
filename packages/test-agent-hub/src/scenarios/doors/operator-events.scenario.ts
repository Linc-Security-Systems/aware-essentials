import {
  Scenario,
  ScenarioContext,
  scenarioFail,
  scenarioPass,
  scenarioSkip,
  TAG_DOORS,
} from "../../scenario.types";
import {
  collectEvents,
  describeEvent,
  EventMessage,
  eventKind,
  isEventMessage,
  validateEvents,
} from "./_utils";

// How long the operator has for each action
const STEP_TIMEOUT_MS = 120000;
// Allowed difference between the event timestamp and when it happened here
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
// Long enough for a polling agent to replay events after a restart
const REPLAY_WINDOW_MS = 30000;

type DoorAccess = {
  kind: "door-access";
  token: string | null;
  tokenType: string | null;
  allowed: boolean;
  doorExit: boolean;
};

type Step = {
  label: string;
  instruction: (doorNames: string) => string;
  matches: (e: EventMessage) => boolean;
  // extra checks on the matched event; returns errors
  check: (ctx: ScenarioContext, e: EventMessage) => string[];
};

const asAccess = (e: EventMessage) => e.event as DoorAccess;

const STEPS: Step[] = [
  {
    label: "Request to exit",
    instruction: (doors) =>
      `Press the Request-to-Exit button of one of these doors: ${doors}`,
    matches: (e) => eventKind(e) === "door-access" && asAccess(e).doorExit,
    check: (ctx, e) => {
      ctx.log(`Request to exit: allowed=${asAccess(e).allowed}`);
      return [];
    },
  },
  {
    label: "Door forced",
    instruction: (doors) =>
      `Open one of these doors without unlocking it (force it, or use the mechanical key), then close it: ${doors}`,
    matches: (e) => eventKind(e) === "door-force",
    check: () => [],
  },
  {
    label: "Card presented",
    instruction: (doors) =>
      `Present a card at a reader of one of these doors — an unknown card is fine, access will be denied: ${doors}`,
    matches: (e) =>
      (eventKind(e) === "door-access" && !asAccess(e).doorExit) ||
      eventKind(e) === "reader-auth",
    check: (ctx, e) => {
      const { token, tokenType, allowed } = asAccess(e);
      ctx.log(
        `Card presented: ${eventKind(e)} allowed=${allowed} token=${token} tokenType=${tokenType}`,
      );
      // Aware shows the token of a denied card so it can be enrolled
      return token
        ? []
        : [
            `Card presented: event has no token, so Aware cannot show which card was used: ${JSON.stringify(e.event)}`,
          ];
    },
  },
];

// ----------------------------------------------------------------
// runSteps — asks the operator for each action and waits for the
//   event it should produce. The event timestamp must fall between
//   the request and the event's arrival (catches controller local
//   time being read as UTC). Skipped steps are not failures.
// ----------------------------------------------------------------

const runSteps = async (ctx: ScenarioContext, doorNames: string) => {
  const matched: EventMessage[] = [];
  const errors: string[] = [];

  for (const step of STEPS) {
    const askedAt = Date.now();
    let result: EventMessage | "skipped";
    try {
      result = await ctx.askOperator(
        step.instruction(doorNames),
        ctx.waitForMessage(
          (msg) => isEventMessage(msg) && step.matches(msg),
          STEP_TIMEOUT_MS,
        ) as Promise<EventMessage>,
      );
    } catch {
      errors.push(
        `${step.label}: no matching event within ${STEP_TIMEOUT_MS / 1000}s`,
      );
      ctx.tellOperator(
        `${step.label}: no event received within ${STEP_TIMEOUT_MS / 1000}s — moving on`,
      );
      continue;
    }
    if (result === "skipped") {
      ctx.log(`${step.label}: skipped by the operator`);
      ctx.tellOperator(`${step.label}: skipped`);
      continue;
    }
    const receivedAt = Date.now();
    ctx.tellOperator(`${step.label}: event received`);

    // the whole message, so what the agent sends can be checked by eye
    ctx.log(`${step.label}: ${describeEvent(result)}`);
    ctx.log(`${step.label}: received ${JSON.stringify(result)}`);
    errors.push(...step.check(ctx, result));
    if (
      result.eventTimestamp < askedAt - MAX_CLOCK_SKEW_MS ||
      result.eventTimestamp > receivedAt + MAX_CLOCK_SKEW_MS
    ) {
      errors.push(
        `${step.label}: event timestamp ${new Date(result.eventTimestamp).toISOString()} is outside the time it happened (${new Date(askedAt).toISOString()} – ${new Date(receivedAt).toISOString()}) — check time zone handling`,
      );
    }
    matched.push(result);
  }

  return { matched, errors };
};

// ----------------------------------------------------------------
// checkResume — restarts with the earliest matched event as the
//   cursor Aware would send. Every later access event (door-access,
//   reader-auth) must be pushed again with the same eventForeignRef:
//   controllers keep those in their event log. Other events (e.g.
//   door-force) may only be derived from live state on some systems,
//   so a missing replay of those is noted, not failed.
// ----------------------------------------------------------------

const REPLAY_REQUIRED_KINDS = ["door-access", "reader-auth"];

const checkResume = async (ctx: ScenarioContext, matched: EventMessage[]) => {
  const sorted = [...matched].sort(
    (a, b) => a.eventTimestamp - b.eventTimestamp,
  );
  const [cursor] = sorted;
  const later = sorted.filter(
    (e) => cursor && e.eventTimestamp > cursor.eventTimestamp,
  );
  if (!cursor || later.length === 0) {
    ctx.log(
      `Need at least two events with different timestamps to test resuming — skipping`,
    );
    return [];
  }

  ctx.tellOperator(
    `Restarting the agent to check the events are replayed — this takes about ${REPLAY_WINDOW_MS / 1000}s`,
  );
  await ctx.getReply({ kind: "stop", provider: ctx.provider });
  ctx.log(
    `Restarting with cursor ${describeEvent(cursor)}; expecting ${later.length} later event(s) again`,
  );

  // subscribe before start so replayed events sent right away are not missed
  const replay$ = collectEvents(ctx, REPLAY_WINDOW_MS);
  await ctx.getReply({
    kind: "start",
    provider: ctx.provider,
    config: ctx.config,
    lastEventForeignRef: cursor.eventForeignRef,
    lastEventTimestamp: cursor.eventTimestamp,
  });
  const replayed = await replay$;
  ctx.log(
    `Resume: ${replayed.length} event(s) received after restart${replayed.length > 0 ? ":" : ""}`,
  );
  for (const e of replayed) ctx.log(`  ${describeEvent(e)}`);
  const replayedRefs = new Set(replayed.map((e) => e.eventForeignRef));

  const notReplayed = later.filter((e) => !replayedRefs.has(e.eventForeignRef));
  const required = notReplayed.filter((e) =>
    REPLAY_REQUIRED_KINDS.includes(eventKind(e)),
  );
  for (const e of notReplayed.filter((e) => !required.includes(e))) {
    ctx.warn(
      `${eventKind(e)} ${e.eventForeignRef} was not re-sent after restart — if the provider logs it, the agent should replay it; if it is derived from live state, it cannot be`,
    );
  }
  if (required.length > 0) {
    return [
      `Resume: ${required.length} access event(s) after the cursor were not re-sent (or were re-sent with a different eventForeignRef) within ${REPLAY_WINDOW_MS}ms: ${required
        .map(describeEvent)
        .join(", ")} — see the log for the events received after restart`,
    ];
  }
  ctx.log(
    `Resume: ${later.length - notReplayed.length} of ${later.length} later event(s) re-sent, including every access event`,
  );
  return [];
};

// ----------------------------------------------------------------
// Scenario definition (needs --interactive)
//   1. request to exit  → door-access with doorExit
//   2. door forced      → door-force
//   3. card presented   → door-access (or reader-auth) with a token
//   4. the events are valid for Aware, and the access events are
//      replayed after a restart from the earliest one
// ----------------------------------------------------------------

const s: Scenario = {
  tags: [TAG_DOORS],
  name: "Doors: Reports operator-triggered events (interactive)",
  description:
    "Asks an operator to press a request-to-exit button, force a door and present a card, and verifies the resulting events and that the access events are replayed after a restart. Requires --interactive; skipped otherwise",
  run: async (ctx) => {
    if (!ctx.interactive) {
      return scenarioSkip(`needs an operator — run with --interactive`);
    }

    await ctx.getReply({
      kind: "start",
      provider: ctx.provider,
      config: ctx.config,
      lastEventForeignRef: null,
      lastEventTimestamp: null,
    });

    const { devices } = await ctx.getReply({
      kind: "get-available-devices",
      provider: ctx.provider,
    });
    const doorNames = devices
      .filter((d) => d.type === "door")
      .map((d) => d.name)
      .join(", ");
    if (!doorNames) {
      throw new Error("No doors found, cannot proceed with test");
    }

    const { matched, errors } = await runSteps(ctx, doorNames);
    errors.push(...validateEvents(ctx, matched, devices));
    ctx.tellOperator(
      `That's everything needed from you — finishing the remaining checks`,
    );
    errors.push(...(await checkResume(ctx, matched)));
    ctx.tellOperator(`Checks finished`);

    await ctx.getReply({ kind: "stop", provider: ctx.provider });

    if (errors.length > 0) return scenarioFail(...errors);
    return matched.length > 0
      ? scenarioPass()
      : scenarioSkip(`the operator skipped every step`);
  },
};

export default s;
