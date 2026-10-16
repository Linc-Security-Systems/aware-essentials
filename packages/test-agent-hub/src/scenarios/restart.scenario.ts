import { FromAgent, Message, PushStateUpdateRq } from "@awarevue/api-types";
import {
  Scenario,
  ScenarioContext,
  scenarioFail,
  scenarioPass,
  TAG_CORE,
  TAG_LIFECYCLE,
} from "../scenario.types";

// How long to collect connectivity states after each start
const STATE_WINDOW_MS = 15000;

const isConnectivityState = (
  msg: Message<FromAgent>,
): msg is Message<PushStateUpdateRq> =>
  msg.kind === "state" && "connected" in msg.mergeProps;

// Starts collecting the devices the agent reports connectivity for
const collectConnectivity = (ctx: ScenarioContext) =>
  ctx
    .waitForSomeMessages(isConnectivityState, STATE_WINDOW_MS)
    .then(
      (msgs) =>
        new Set(
          (msgs as Message<PushStateUpdateRq>[]).map((m) => m.foreignRef),
        ),
    )
    .catch(() => new Set<string>());

const startAndDiscover = async (ctx: ScenarioContext) => {
  // subscribe before start so states sent right away are not missed
  const connectivity$ = collectConnectivity(ctx);
  await ctx.getReply({
    kind: "start",
    provider: ctx.provider,
    config: ctx.config,
    lastEventForeignRef: null,
    lastEventTimestamp: null,
  });
  const discovery = await ctx.getReply({
    kind: "get-available-devices",
    provider: ctx.provider,
  });
  return {
    devices: new Map(discovery.devices.map((d) => [d.foreignRef, d.type])),
    connectivity: await connectivity$,
  };
};

// ----------------------------------------------------------------
// Aware restarts a provider (e.g. after a config edit) by sending
// stop, then start on the same connection. On stop it marks every
// device of the provider disconnected itself, so after the new start
// the agent must report connectivity again or the devices stay
// offline in Aware.
//   1. start → discover → note devices reporting `connected`
//   2. stop → start → discover
//   3. same devices discovered, and each device from 1 reports
//      `connected` again
// ----------------------------------------------------------------

const s: Scenario = {
  name: "restart",
  description:
    "Stops and restarts the provider on the same connection, as Aware does after a config change, and verifies discovery still works and devices report their connectivity again",
  tags: [TAG_CORE, TAG_LIFECYCLE],

  async run(ctx) {
    const first = await startAndDiscover(ctx);
    ctx.log(
      `First start: ${first.devices.size} device(s), ${first.connectivity.size} reported connectivity`,
    );

    await ctx.getReply({ kind: "stop", provider: ctx.provider });
    ctx.log(`Stopped`);

    const second = await startAndDiscover(ctx);
    ctx.log(
      `After restart: ${second.devices.size} device(s), ${second.connectivity.size} reported connectivity`,
    );

    await ctx.getReply({ kind: "stop", provider: ctx.provider });

    const errors: string[] = [];

    const lost = [...first.devices.keys()].filter(
      (ref) => !second.devices.has(ref),
    );
    const added = [...second.devices.keys()].filter(
      (ref) => !first.devices.has(ref),
    );
    const retyped = [...first.devices].filter(
      ([ref, type]) =>
        second.devices.has(ref) && second.devices.get(ref) !== type,
    );
    if (lost.length > 0 || added.length > 0 || retyped.length > 0) {
      errors.push(
        `Devices differ after restart — missing: [${lost}], new: [${added}], changed type: [${retyped.map(([ref]) => ref)}]`,
      );
    }

    const silent = [...first.connectivity].filter(
      (ref) => !second.connectivity.has(ref),
    );
    if (silent.length > 0) {
      errors.push(
        `${silent.length} device(s) did not report connectivity within ${STATE_WINDOW_MS}ms after restart, so Aware would keep them disconnected: ${silent.join(", ")}`,
      );
    }

    return errors.length > 0 ? scenarioFail(...errors) : scenarioPass();
  },
};

export default s;
