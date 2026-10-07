import {
  eventsByDeviceType,
  FromAgent,
  isDeviceEvent,
  Message,
  PushEventRq,
} from "@awarevue/api-types";
import { ScenarioContext } from "../../scenario.types";

export type EventMessage = Message<PushEventRq>;

export const isEventMessage = (msg: Message<FromAgent>): msg is EventMessage =>
  msg.kind === "event";

// ----------------------------------------------------------------
// findConnectedDoors — discovers devices and returns the doors the
//   agent reports as connected (waits for their initial state)
// ----------------------------------------------------------------

export const findConnectedDoors = async (ctx: ScenarioContext) => {
  const devicesResponse = await ctx.getReply({
    kind: "get-available-devices",
    provider: ctx.provider,
  });
  const doors = devicesResponse.devices.filter((d) => d.type === "door");
  ctx.log(`Found ${doors.length} doors`);

  const states = await ctx.deviceState.waitForDevices(
    doors.map((d) => d.foreignRef),
    (state) => "connected" in state,
    30000,
  );
  const connected = doors.filter(
    (d) => states.get(d.foreignRef)?.connected === true,
  );
  ctx.log(`Found ${connected.length} connected doors`);

  return { devices: devicesResponse.devices, connected };
};

// ----------------------------------------------------------------
// cycleDoor — unlocks, then locks a door, waiting for the reported
//   state each time. Doors produce events while doing so.
// ----------------------------------------------------------------

export const cycleDoor = async (
  ctx: ScenarioContext,
  door: Awaited<ReturnType<typeof findConnectedDoors>>["connected"][number],
) => {
  for (const [command, locked] of [
    ["door.unlock", false],
    ["door.lock", true],
  ] as const) {
    await ctx.getReply({
      kind: "command",
      device: { ...door, presets: [] },
      command,
      params: {},
    });
    await ctx.deviceState.waitUntil(
      door.foreignRef,
      (state) => state.locked === locked,
      30000,
    );
  }
};

// ----------------------------------------------------------------
// collectEvents — starts collecting `event` messages now, for
//   `windowMs`. Resolves with whatever arrived (possibly none).
//   Call before the action that should produce the events.
// ----------------------------------------------------------------

export const collectEvents = (ctx: ScenarioContext, windowMs: number) =>
  ctx
    .waitForSomeMessages(isEventMessage, windowMs)
    .then((msgs) => msgs as EventMessage[])
    .catch(() => [] as EventMessage[]);

export const eventKind = (e: EventMessage) =>
  (e.event as { kind?: string } | null)?.kind ?? "";

// Allowed clock skew between the agent / controller and this machine
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
// Events any device can raise, on top of its type-specific ones
const GENERIC_EVENT_KINDS = [
  "device-connected",
  "device-disconnected",
  "device-command",
];

// ----------------------------------------------------------------
// validateEvents — Aware stores an event only when (aware-api
//   agent-middleware and device-event-store):
//   - the event passes isDeviceEvent (otherwise it is dropped with a
//     warning)
//   - (provider, eventForeignRef) is unique — repeated refs are
//     treated as the same event
//   - foreignRef is a device Aware knows for the provider
//   The event timestamp is used to resume events after a restart, so
//   it must be epoch milliseconds. Returns the errors; event kinds
//   not listed for the device type are raised as warnings.
// ----------------------------------------------------------------

export const validateEvents = (
  ctx: ScenarioContext,
  events: EventMessage[],
  devices: { foreignRef: string; type: string }[],
) => {
  const deviceTypes = new Map(devices.map((d) => [d.foreignRef, d.type]));
  const errors: string[] = [];

  for (const msg of events) {
    const at = `event ${msg.eventForeignRef || "(no ref)"} from '${msg.foreignRef}'`;
    if (msg.provider !== ctx.provider) {
      errors.push(
        `${at}: provider '${msg.provider}', expected '${ctx.provider}'`,
      );
    }
    const type = deviceTypes.get(msg.foreignRef);
    if (!type) {
      errors.push(`${at}: foreignRef is not a discovered device`);
    }
    if (!msg.eventForeignRef) {
      errors.push(`${at}: eventForeignRef is empty`);
    }
    if (!isDeviceEvent(msg.event)) {
      errors.push(
        `${at}: event does not match any device event schema, Aware drops it: ${JSON.stringify(msg.event)}`,
      );
    }
    // seconds instead of milliseconds, or far in the future
    if (
      typeof msg.eventTimestamp !== "number" ||
      msg.eventTimestamp < 1e12 ||
      msg.eventTimestamp > Date.now() + MAX_CLOCK_SKEW_MS
    ) {
      errors.push(
        `${at}: eventTimestamp ${msg.eventTimestamp} is not a plausible epoch milliseconds value`,
      );
    }
    const allowed = [
      ...((type &&
        eventsByDeviceType[type as keyof typeof eventsByDeviceType]) ||
        []),
      ...GENERIC_EVENT_KINDS,
    ] as string[];
    if (type && !allowed.includes(eventKind(msg))) {
      ctx.warn(
        `'${eventKind(msg)}' is not a listed event for device type '${type}'`,
      );
    }
  }

  const refs = events.map((e) => e.eventForeignRef);
  const repeated = [...new Set(refs.filter((r, i) => refs.indexOf(r) !== i))];
  if (repeated.length > 0) {
    errors.push(
      `eventForeignRef reused by different events, Aware keeps only the first: ${repeated.join(", ")}`,
    );
  }
  return errors;
};

// One line per event for scenario logs: ref, kind, device and timestamp
export const describeEvent = (e: EventMessage) =>
  `${e.eventForeignRef} ${eventKind(e)} from '${e.foreignRef}' at ${new Date(e.eventTimestamp).toISOString()} (${e.eventTimestamp})`;
