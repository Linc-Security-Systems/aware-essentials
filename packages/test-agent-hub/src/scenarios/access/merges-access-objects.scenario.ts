import { v4 } from "uuid";
import {
  ExternalAccessRuleProps,
  ExternalPersonProps,
  ExternalScheduleProps,
} from "@awarevue/api-types";
import {
  Scenario,
  ScenarioContext,
  scenarioPass,
  TAG_ACCESS_PROPS,
  TAG_ACCESS,
} from "../../scenario.types";
import {
  newPerson,
  newRule,
  newSchedule,
  personsMatch,
  rulesMatch,
  schedulesMatch,
} from "./_utils";

// ----------------------------------------------------------------
// mergePerson — validate + apply + optional prop verification
//   registers its own best-effort cleanup automatically
// ----------------------------------------------------------------

const mergePerson = async (
  ctx: ScenarioContext,
  credentials: ExternalPersonProps["credentials"],
) => {
  const awareId = v4();
  const props = newPerson(credentials);

  const validateResult = await ctx.getReply({
    kind: "validate-change",
    provider: ctx.provider,
    refMap: { person: { [awareId]: [] } },
    devices: {},
    mutations: [
      {
        kind: "merge",
        objectId: awareId,
        objectKind: "person",
        original: props,
        props,
      },
    ],
  });

  if (validateResult.issues.length > 0) {
    throw new Error(
      `mergePerson: expected 0 issues, got ${validateResult.issues.length}`,
    );
  }
  ctx.log(`Validation passed with 0 issues as expected`);

  const applyResult = await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: { person: { [awareId]: [] } },
    devices: {},
    mutations: [
      {
        kind: "merge",
        objectId: awareId,
        objectKind: "person",
        original: props,
        props,
      },
    ],
  });

  const refs = applyResult.refs.person?.[awareId] ?? [];
  if (refs.length < 1) {
    throw new Error(
      `mergePerson: expected at least 1 reference, got ${refs.length}`,
    );
  }
  ctx.log(`Apply succeeded with ${refs.length} reference(s) as expected`);

  ctx.registerCleanup(`person ${awareId}`, async () => {
    await ctx.getReply({
      kind: "apply-change",
      provider: ctx.provider,
      refMap: { person: { [awareId]: refs } },
      devices: {},
      mutations: [
        {
          kind: "delete",
          objectId: awareId,
          objectKind: "person",
          original: props,
        },
      ],
    });
  });

  if (ctx.tags.includes(TAG_ACCESS_PROPS)) {
    const describeResult = await ctx.getReply({
      kind: "describe-object",
      provider: ctx.provider,
      objectKind: "person",
      objectAssignedRef: refs.join(","),
    });

    if (describeResult.object === null) {
      throw new Error(
        `describe-object returned null for person with ref(s): ${refs.join(",")}`,
      );
    }

    if (!personsMatch(describeResult.object.data as any, props)) {
      throw new Error(
        `Person props mismatch after save. Expected: ${JSON.stringify(props)}, Got: ${JSON.stringify(describeResult.object.data)}`,
      );
    }

    ctx.log(`Props comparison passed: agent returned correct person props`);
  }

  return { awareId, refs, props };
};

// ----------------------------------------------------------------
// deletePerson — test assertion: delete + verify describe returns null
// ----------------------------------------------------------------

const deletePerson = async (
  ctx: ScenarioContext,
  awareId: string,
  refs: string[],
  props: ExternalPersonProps,
) => {
  await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: { person: { [awareId]: refs } },
    devices: {},
    mutations: [
      {
        kind: "delete",
        objectId: awareId,
        objectKind: "person",
        original: props,
      },
    ],
  });

  const describeResult = await ctx.getReply({
    kind: "describe-object",
    provider: ctx.provider,
    objectKind: "person",
    objectAssignedRef: refs.join(","),
  });

  if (describeResult.object !== null) {
    throw new Error(
      `deletePerson: describe-object must return null after delete, got: ${JSON.stringify(describeResult.object)}`,
    );
  }

  ctx.log(`Deleted person ${awareId} and confirmed it no longer exists`);
};

// ----------------------------------------------------------------
// mergeSchedule — validate + apply + optional prop verification
//   registers its own best-effort cleanup automatically
// ----------------------------------------------------------------

const mergeSchedule = async (ctx: ScenarioContext) => {
  const awareId = v4();
  const props = newSchedule();

  const validateResult = await ctx.getReply({
    kind: "validate-change",
    provider: ctx.provider,
    refMap: { schedule: { [awareId]: [] } },
    devices: {},
    mutations: [
      {
        kind: "merge",
        objectId: awareId,
        objectKind: "schedule",
        original: props,
        props,
      },
    ],
  });

  if (validateResult.issues.length > 0) {
    throw new Error(
      `mergeSchedule: expected 0 issues, got ${validateResult.issues.length}`,
    );
  }
  ctx.log(`Validation passed with 0 issues as expected`);

  const applyResult = await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: { schedule: { [awareId]: [] } },
    devices: {},
    mutations: [
      {
        kind: "merge",
        objectId: awareId,
        objectKind: "schedule",
        original: props,
        props,
      },
    ],
  });

  const refs = applyResult.refs.schedule?.[awareId] ?? [];
  if (refs.length < 1) {
    throw new Error(
      `mergeSchedule: expected at least 1 reference, got ${refs.length}`,
    );
  }
  ctx.log(`Apply succeeded with ${refs.length} reference(s) as expected`);

  ctx.registerCleanup(`schedule ${awareId}`, async () => {
    await ctx.getReply({
      kind: "apply-change",
      provider: ctx.provider,
      refMap: { schedule: { [awareId]: refs } },
      devices: {},
      mutations: [
        {
          kind: "delete",
          objectId: awareId,
          objectKind: "schedule",
          original: props,
        },
      ],
    });
  });

  if (ctx.tags.includes(TAG_ACCESS_PROPS)) {
    const describeResult = await ctx.getReply({
      kind: "describe-object",
      provider: ctx.provider,
      objectKind: "schedule",
      objectAssignedRef: refs.join(","),
    });

    if (describeResult.object === null) {
      throw new Error(
        `describe-object returned null for schedule with ref(s): ${refs.join(",")}`,
      );
    }

    if (!schedulesMatch(describeResult.object.data as any, props)) {
      throw new Error(
        `Schedule props mismatch after save. Expected: ${JSON.stringify(props)}, Got: ${JSON.stringify(describeResult.object.data)}`,
      );
    }

    ctx.log(`Props comparison passed: agent returned correct schedule props`);
  }

  return { awareId, refs, props };
};

// ----------------------------------------------------------------
// deleteSchedule — test assertion: delete + verify describe returns null
// ----------------------------------------------------------------

const deleteSchedule = async (
  ctx: ScenarioContext,
  awareId: string,
  refs: string[],
  props: ExternalScheduleProps,
) => {
  await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: { schedule: { [awareId]: refs } },
    devices: {},
    mutations: [
      {
        kind: "delete",
        objectId: awareId,
        objectKind: "schedule",
        original: props,
      },
    ],
  });

  const describeResult = await ctx.getReply({
    kind: "describe-object",
    provider: ctx.provider,
    objectKind: "schedule",
    objectAssignedRef: refs.join(","),
  });

  if (describeResult.object !== null) {
    throw new Error(
      `deleteSchedule: describe-object must return null after delete, got: ${JSON.stringify(describeResult.object)}`,
    );
  }

  ctx.log(`Deleted schedule ${awareId} and confirmed it no longer exists`);
};

// ----------------------------------------------------------------
// deleteAccessRule — test assertion: delete + verify describe returns null
// ----------------------------------------------------------------

const deleteAccessRule = async (
  ctx: ScenarioContext,
  ruleId: string,
  refs: string[],
  props: ExternalAccessRuleProps,
  dependentRefMap: Record<string, Record<string, string[]>>,
  devices: Record<string, Record<string, unknown>>,
) => {
  await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: {
      accessRule: { [ruleId]: refs },
      ...dependentRefMap,
    },
    devices,
    mutations: [
      {
        kind: "delete",
        objectId: ruleId,
        objectKind: "accessRule",
        original: props,
      },
    ],
  });

  const describeResult = await ctx.getReply({
    kind: "describe-object",
    provider: ctx.provider,
    objectKind: "accessRule",
    objectAssignedRef: refs.join(","),
  });

  if (describeResult.object !== null) {
    throw new Error(
      `deleteAccessRule: describe-object must return null after delete, got: ${JSON.stringify(describeResult.object)}`,
    );
  }

  ctx.log(`Deleted accessRule ${ruleId} and confirmed it no longer exists`);
};

// ----------------------------------------------------------------
// mergeAccessRule — creates real prerequisite persons/schedules,
//   validates + applies the rule, verifies props, then exercises
//   all delete assertions before the runner's cleanup fires
// ----------------------------------------------------------------

const mergeAccessRule = async (ctx: ScenarioContext) => {
  const devicesResponse = await ctx.getReply({
    kind: "get-available-devices",
    provider: ctx.provider,
  });

  const readers = devicesResponse.devices.filter((d) => d.type === "reader");
  if (readers.length < 2) {
    ctx.log(`Less than 2 readers found, skipping access rule merge test`);
    return;
  }
  const [reader1, reader2] = readers;
  ctx.log(
    `Found ${readers.length} readers, using them to test access rule merge`,
  );

  // Create real prerequisite objects (each registers its own cleanup)
  const p1 = await mergePerson(ctx, []);
  const p2 = await mergePerson(ctx, []);
  const s1 = await mergeSchedule(ctx);
  const s2 = await mergeSchedule(ctx);

  const reader1Id = v4();
  const reader2Id = v4();
  const ruleId = v4();

  const ruleProps: ExternalAccessRuleProps = {
    ...newRule(),
    appliedTo: [p1.awareId, p2.awareId],
    permissions: [
      { deviceId: reader1Id, scheduleId: s1.awareId },
      { deviceId: reader2Id, scheduleId: s2.awareId },
    ],
    groupPermissions: [],
  };

  const dependentRefMap: Record<string, Record<string, string[]>> = {
    person: { [p1.awareId]: p1.refs, [p2.awareId]: p2.refs },
    schedule: { [s1.awareId]: s1.refs, [s2.awareId]: s2.refs },
    device: {
      [reader1Id]: [reader1.foreignRef],
      [reader2Id]: [reader2.foreignRef],
    },
  };
  const devices: Record<string, Record<string, unknown>> = {
    [reader1Id]: reader1 as Record<string, unknown>,
    [reader2Id]: reader2 as Record<string, unknown>,
  };

  const validateResult = await ctx.getReply({
    kind: "validate-change",
    provider: ctx.provider,
    refMap: {
      accessRule: { [ruleId]: [] },
      ...dependentRefMap,
    },
    devices,
    mutations: [
      {
        kind: "merge",
        objectId: ruleId,
        objectKind: "accessRule",
        original: ruleProps,
        props: ruleProps,
      },
    ],
  });

  if (validateResult.issues.length > 0) {
    throw new Error(
      `mergeAccessRule: expected 0 issues, got ${validateResult.issues.length}`,
    );
  }
  ctx.log(`Validation passed with 0 issues as expected`);

  const applyResult = await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: {
      accessRule: { [ruleId]: [] },
      ...dependentRefMap,
    },
    devices,
    mutations: [
      {
        kind: "merge",
        objectId: ruleId,
        objectKind: "accessRule",
        original: ruleProps,
        props: ruleProps,
      },
    ],
  });

  const ruleRefs = applyResult.refs.accessRule?.[ruleId] ?? [];
  if (ruleRefs.length < 1) {
    throw new Error(
      `mergeAccessRule: expected at least 1 reference, got ${ruleRefs.length}`,
    );
  }
  ctx.log(`Apply succeeded with ${ruleRefs.length} reference(s) as expected`);

  ctx.registerCleanup(`accessRule ${ruleId}`, async () => {
    await ctx.getReply({
      kind: "apply-change",
      provider: ctx.provider,
      refMap: {
        accessRule: { [ruleId]: ruleRefs },
        ...dependentRefMap,
      },
      devices,
      mutations: [
        {
          kind: "delete",
          objectId: ruleId,
          objectKind: "accessRule",
          original: ruleProps,
        },
      ],
    });
  });

  if (ctx.tags.includes(TAG_ACCESS_PROPS)) {
    const describeResult = await ctx.getReply({
      kind: "describe-object",
      provider: ctx.provider,
      objectKind: "accessRule",
      objectAssignedRef: ruleRefs.join(","),
    });

    if (describeResult.object === null) {
      throw new Error(
        `describe-object returned null for accessRule with ref(s): ${ruleRefs.join(",")}`,
      );
    }

    // The third party returns its own local refs, not Aware IDs, so we normalize
    // ruleProps to use the assigned refs before comparing.
    const normalizedRuleProps: ExternalAccessRuleProps = {
      ...ruleProps,
      appliedTo: [p1.refs.join(","), p2.refs.join(",")],
      permissions: [
        { deviceId: reader1.foreignRef, scheduleId: s1.refs.join(",") },
        { deviceId: reader2.foreignRef, scheduleId: s2.refs.join(",") },
      ],
    };

    if (!rulesMatch(describeResult.object.data as any, normalizedRuleProps)) {
      throw new Error(
        `AccessRule props mismatch after save. Expected: ${JSON.stringify(normalizedRuleProps)}, Got: ${JSON.stringify(describeResult.object.data)}`,
      );
    }

    ctx.log(`Props comparison passed: agent returned correct accessRule props`);
  }

  // Test assertions: verify each delete removes the object
  await deleteAccessRule(
    ctx,
    ruleId,
    ruleRefs,
    ruleProps,
    dependentRefMap,
    devices,
  );
  await deletePerson(ctx, p1.awareId, p1.refs, p1.props);
  await deletePerson(ctx, p2.awareId, p2.refs, p2.props);
  await deleteSchedule(ctx, s1.awareId, s1.refs, s1.props);
  await deleteSchedule(ctx, s2.awareId, s2.refs, s2.props);
};

const mergeZone = async () => {
  // TODO implement when we have a test provider that supports zones
};

const s: Scenario = {
  tags: [TAG_ACCESS],
  name: "Access Sync: Merges Access Objects it supports",
  description: "Access Sync: Merges Access Objects it supports",
  run: async (ctx) => {
    await ctx.getReply({
      kind: "start",
      provider: ctx.provider,
      config: ctx.config,
      lastEventForeignRef: null,
      lastEventTimestamp: null,
    });

    const accessObjects = ctx.registerPayload.accessControlProviders
      ? ctx.registerPayload.accessControlProviders[ctx.provider].accessObjects
      : [];

    if (accessObjects.includes("person")) {
      ctx.log(`Provider supports 'person' access object, testing merge...`);
      const person = await mergePerson(ctx, [
        {
          type: "card",
          value: "12345678",
        },
        {
          type: "pin",
          value: "1234",
        },
      ]);
      await deletePerson(ctx, person.awareId, person.refs, person.props);
    }

    if (accessObjects.includes("schedule")) {
      ctx.log(`Provider supports 'schedule' access object, testing merge...`);
      const schedule = await mergeSchedule(ctx);
      await deleteSchedule(
        ctx,
        schedule.awareId,
        schedule.refs,
        schedule.props,
      );
    }

    if (accessObjects.includes("accessRule")) {
      ctx.log(`Provider supports 'accessRule' access object, testing merge...`);
      await mergeAccessRule(ctx);
    }

    if (accessObjects.includes("zone")) {
      ctx.log(`Provider supports 'zone' access object, testing merge...`);
      await mergeZone();
    }

    await ctx.runCleanups();

    await ctx.getReply({
      kind: "stop",
      provider: ctx.provider,
    });

    return scenarioPass();
  },
};

export default s;
