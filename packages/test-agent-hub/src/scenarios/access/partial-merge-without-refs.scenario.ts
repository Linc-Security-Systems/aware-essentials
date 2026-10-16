import { v4 } from "uuid";
import {
  AccessMutation,
  ExternalAccessRuleProps,
  ExternalPersonProps,
  ExternalScheduleProps,
} from "@awarevue/api-types";
import {
  Scenario,
  ScenarioContext,
  scenarioPass,
  scenarioSkip,
  TAG_ACCESS,
  TAG_ACCESS_PROPS,
} from "../../scenario.types";
import {
  accessObjectsOf,
  createTestPerson,
  createTestSchedule,
  describeObject,
  Devices,
  getReaders,
  newPerson,
  newRule,
  newSchedule,
  personsMatch,
  RefMap,
  rulesMatch,
  schedulesMatch,
  supportsCustomSchedules,
  uniqueName,
} from "./_utils";

// ----------------------------------------------------------------
// mergeWithoutRefs — Aware sends an edit as a partial merge even when
//   it holds no refs for the object in this provider (e.g. the object
//   existed before the provider was added, or its refs were lost).
//   The agent must create it from { ...original, ...props }.
//   Validates + applies, registers cleanup, and (TAG_ACCESS_PROPS)
//   describes the object and compares it with the merged props.
// ----------------------------------------------------------------

const mergeWithoutRefs = async <T extends object>(
  ctx: ScenarioContext,
  opts: {
    objectKind: "person" | "schedule" | "accessRule";
    original: T;
    changes: Partial<T>;
    dependencyRefs?: RefMap;
    devices?: Devices;
    // maps Aware IDs inside the props to the provider's refs
    normalize?: (props: T) => T;
    match: (provider: T, expected: T) => boolean;
  },
) => {
  const { objectKind, original, changes } = opts;
  const awareId = v4();
  const label = `Partial ${objectKind} merge without refs`;

  const request = (refs: string[]) => ({
    provider: ctx.provider,
    refMap: { ...opts.dependencyRefs, [objectKind]: { [awareId]: refs } },
    devices: opts.devices ?? {},
  });

  const merge = {
    ...request([]),
    mutations: [
      {
        kind: "merge",
        objectId: awareId,
        objectKind,
        original,
        props: { ...changes, lastModifiedOn: new Date().toISOString() },
      } as AccessMutation,
    ],
  };

  const v = await ctx.getReply({ kind: "validate-change", ...merge });
  if (v.issues.length > 0) {
    throw new Error(
      `${label}: expected 0 issues, got ${v.issues.length}: ${JSON.stringify(v.issues)}`,
    );
  }

  const r = await ctx.getReply({ kind: "apply-change", ...merge });
  const refs = (r.refs as RefMap)[objectKind]?.[awareId] ?? [];
  if (refs.length < 1) {
    throw new Error(
      `${label}: expected the object to be created with ≥1 ref, got none`,
    );
  }

  const expected: T = { ...original, ...changes };
  ctx.registerCleanup(`${objectKind} ${awareId}`, async () => {
    await ctx.getReply({
      kind: "apply-change",
      ...request(refs),
      mutations: [
        {
          kind: "delete",
          objectId: awareId,
          objectKind,
          original: expected,
        } as AccessMutation,
      ],
    });
  });
  ctx.log(`${label}: created with ref(s) [${refs}]`);

  if (ctx.tags.includes(TAG_ACCESS_PROPS)) {
    const got = (await describeObject(ctx, objectKind, refs)) as T;
    const normalized = opts.normalize ? opts.normalize(expected) : expected;
    if (!opts.match(got, normalized)) {
      throw new Error(
        `${label}: expected original with the changes applied. Expected: ${JSON.stringify(normalized)}, Got: ${JSON.stringify(got)}`,
      );
    }
    ctx.log(`${label}: holds original props plus the changes`);
  }
};

const testPerson = (ctx: ScenarioContext) =>
  mergeWithoutRefs<ExternalPersonProps>(ctx, {
    objectKind: "person",
    original: newPerson([{ type: "card", value: "85274196" }]),
    changes: { firstName: uniqueName() },
    match: (provider, aware) =>
      personsMatch({ provider, aware, warn: ctx.warn }),
  });

const testSchedule = (ctx: ScenarioContext) =>
  mergeWithoutRefs<ExternalScheduleProps>(ctx, {
    objectKind: "schedule",
    original: newSchedule(),
    changes: { displayName: uniqueName() },
    match: schedulesMatch,
  });

const testAccessRule = async (ctx: ScenarioContext) => {
  const [reader] = await getReaders(ctx, 1);
  if (!reader) {
    ctx.log(`No readers found — skipping access rule test`);
    return;
  }
  const person = await createTestPerson(ctx, newPerson([]));
  const schedule = await createTestSchedule(ctx, "always");
  const readerId = v4();

  const dependencyRefs: RefMap = {
    person: { [person.awareId]: person.state.refs },
    schedule: { [schedule.awareId]: schedule.refs },
    device: { [readerId]: [reader.foreignRef] },
  };
  const ref = (kind: string, id: string) => dependencyRefs[kind][id].join(",");

  await mergeWithoutRefs<ExternalAccessRuleProps>(ctx, {
    objectKind: "accessRule",
    original: {
      ...newRule(),
      appliedTo: [person.awareId],
      permissions: [{ deviceId: readerId, scheduleId: schedule.awareId }],
      groupPermissions: [],
    },
    changes: { displayName: uniqueName() },
    dependencyRefs,
    devices: {
      [readerId]: { ...reader.providerMetadata } as Record<string, unknown>,
    },
    normalize: (props) => ({
      ...props,
      appliedTo: props.appliedTo.map((id) => ref("person", id)),
      permissions: props.permissions.map((p) => ({
        deviceId: ref("device", p.deviceId),
        scheduleId: ref("schedule", p.scheduleId),
      })),
    }),
    match: rulesMatch,
  });
};

// ----------------------------------------------------------------
// Scenario definition
// ----------------------------------------------------------------

const s: Scenario = {
  tags: [TAG_ACCESS],
  name: "Access Sync: Creates objects from partial merges without refs",
  description:
    "Verifies that a partial merge for an object the agent holds no refs for, as Aware sends when editing an object not yet synced to the provider, creates it from the original with the changes applied",
  run: async (ctx) => {
    await ctx.getReply({
      kind: "start",
      provider: ctx.provider,
      config: ctx.config,
      lastEventForeignRef: null,
      lastEventTimestamp: null,
    });

    const accessObjects = accessObjectsOf(ctx);
    const testsPerson = accessObjects.includes("person");
    const testsSchedule =
      accessObjects.includes("schedule") && supportsCustomSchedules(ctx);

    if (testsPerson) {
      ctx.log(`Testing person...`);
      await testPerson(ctx);
    }
    if (testsSchedule) {
      ctx.log(`Testing schedule...`);
      await testSchedule(ctx);
    }
    if (
      accessObjects.includes("accessRule") &&
      accessObjects.includes("person")
    ) {
      ctx.log(`Testing access rule...`);
      await testAccessRule(ctx);
    }

    await ctx.runCleanups();

    await ctx.getReply({
      kind: "stop",
      provider: ctx.provider,
    });

    return testsPerson || testsSchedule
      ? scenarioPass()
      : scenarioSkip(`Provider supports neither 'person' nor custom schedules`);
  },
};

export default s;
