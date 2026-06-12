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
  TAG_ACCESS,
  TAG_ACCESS_PROPS,
} from "../../scenario.types";
import {
  newPerson,
  newRule,
  newSchedule,
  personsMatch,
  rulesMatch,
  schedulesMatch,
  uniqueName,
} from "./_utils";

const refsEqual = (a: string[], b: string[]) =>
  [...a].sort().join(",") === [...b].sort().join(",");

// ----------------------------------------------------------------
// testPersonIdempotence
//   1. create person
//   2. re-merge with identical props  → same refs (no duplicate)
//   3. PATCH: change firstName only   → same refs, describe verifies
//      only firstName changed (TAG_ACCESS_PROPS)
//   4. delete → second delete on stale refs → must succeed
// ----------------------------------------------------------------

const testPersonIdempotence = async (ctx: ScenarioContext) => {
  const awareId = v4();
  const props = newPerson([{ type: "card", value: "87654321" }]);

  // --- create ---
  const r1 = await ctx.getReply({
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
  const refs = r1.refs.person?.[awareId] ?? [];
  if (refs.length < 1) {
    throw new Error(
      `testPersonIdempotence: expected ≥1 ref after create, got ${refs.length}`,
    );
  }
  ctx.log(`Created person with ${refs.length} ref(s)`);

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

  // --- re-merge with identical props → same refs, no duplicate ---
  const r2 = await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: { person: { [awareId]: refs } },
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
  const refs2 = r2.refs.person?.[awareId] ?? [];
  // Empty refs on an update means the agent updated in-place — that is success.
  // Only fail when the agent returns a different non-empty set (a new duplicate was created).
  if (refs2.length > 0 && !refsEqual(refs, refs2)) {
    throw new Error(
      `Re-merge with identical props created a duplicate: original [${refs}], got [${refs2}]`,
    );
  }
  ctx.log(
    `Re-merge with identical props did not create a new ref — no duplicate created`,
  );

  // --- PATCH: change firstName only ---
  const updatedProps: ExternalPersonProps = {
    ...props,
    firstName: uniqueName(),
  };
  const r3 = await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: { person: { [awareId]: refs } },
    devices: {},
    mutations: [
      {
        kind: "merge",
        objectId: awareId,
        objectKind: "person",
        original: props,
        props: updatedProps,
      },
    ],
  });
  const refs3 = r3.refs.person?.[awareId] ?? [];
  if (refs3.length > 0 && !refsEqual(refs, refs3)) {
    throw new Error(
      `PATCH merge created a new ref — expected [${refs}] or none, got [${refs3}]`,
    );
  }
  ctx.log(`PATCH update did not create a new ref`);

  if (ctx.tags.includes(TAG_ACCESS_PROPS)) {
    const dr = await ctx.getReply({
      kind: "describe-object",
      provider: ctx.provider,
      objectKind: "person",
      objectAssignedRef: refs.join(","),
    });
    if (dr.object === null) {
      throw new Error(`describe-object returned null after PATCH update`);
    }
    const got = dr.object.data as ExternalPersonProps;
    if (got.firstName !== updatedProps.firstName) {
      throw new Error(
        `PATCH did not update firstName: expected "${updatedProps.firstName}", got "${got.firstName}"`,
      );
    }
    if (got.lastName !== props.lastName) {
      throw new Error(
        `PATCH clobbered lastName: expected "${props.lastName}", got "${got.lastName}"`,
      );
    }
    if (!personsMatch({ provider: got, aware: updatedProps })) {
      throw new Error(
        `Person PATCH mismatch. Expected: ${JSON.stringify(updatedProps)}, Got: ${JSON.stringify(got)}`,
      );
    }
    ctx.log(
      `PATCH verified: firstName updated, lastName and credentials preserved`,
    );
  }

  // --- delete → second delete on stale refs must succeed ---
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
        original: updatedProps,
      },
    ],
  });
  ctx.log(`Deleted person — now applying second delete with stale refs`);

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
        original: updatedProps,
      },
    ],
  });
  ctx.log(`Stale delete succeeded — idempotent delete for person confirmed`);
};

// ----------------------------------------------------------------
// testScheduleIdempotence
//   1. create schedule
//   2. re-merge with identical props  → same refs (no duplicate)
//   3. PATCH: change displayName only → same refs, describe verifies
//      only displayName changed (TAG_ACCESS_PROPS)
//   4. delete → second delete on stale refs → must succeed
// ----------------------------------------------------------------

const testScheduleIdempotence = async (ctx: ScenarioContext) => {
  const awareId = v4();
  const props = newSchedule();

  // --- create ---
  const r1 = await ctx.getReply({
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
  const refs = r1.refs.schedule?.[awareId] ?? [];
  if (refs.length < 1) {
    throw new Error(
      `testScheduleIdempotence: expected ≥1 ref after create, got ${refs.length}`,
    );
  }
  ctx.log(`Created schedule with ${refs.length} ref(s)`);

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

  // --- re-merge with identical props → same refs, no duplicate ---
  const r2 = await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: { schedule: { [awareId]: refs } },
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
  const refs2 = r2.refs.schedule?.[awareId] ?? [];
  if (refs2.length > 0 && !refsEqual(refs, refs2)) {
    throw new Error(
      `Re-merge with identical props created a duplicate: original [${refs}], got [${refs2}]`,
    );
  }
  ctx.log(
    `Re-merge with identical props did not create a new ref — no duplicate created`,
  );

  // --- PATCH: change displayName only ---
  const updatedProps: ExternalScheduleProps = {
    ...props,
    displayName: uniqueName(),
  };
  const r3 = await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: { schedule: { [awareId]: refs } },
    devices: {},
    mutations: [
      {
        kind: "merge",
        objectId: awareId,
        objectKind: "schedule",
        original: props,
        props: updatedProps,
      },
    ],
  });
  const refs3 = r3.refs.schedule?.[awareId] ?? [];
  if (refs3.length > 0 && !refsEqual(refs, refs3)) {
    throw new Error(
      `PATCH merge created a new ref — expected [${refs}] or none, got [${refs3}]`,
    );
  }
  ctx.log(`PATCH update did not create a new ref`);

  if (ctx.tags.includes(TAG_ACCESS_PROPS)) {
    const dr = await ctx.getReply({
      kind: "describe-object",
      provider: ctx.provider,
      objectKind: "schedule",
      objectAssignedRef: refs.join(","),
    });
    if (dr.object === null) {
      throw new Error(`describe-object returned null after PATCH update`);
    }
    const got = dr.object.data as ExternalScheduleProps;
    if (got.displayName !== updatedProps.displayName) {
      throw new Error(
        `PATCH did not update displayName: expected "${updatedProps.displayName}", got "${got.displayName}"`,
      );
    }
    if (!schedulesMatch(got, updatedProps)) {
      throw new Error(
        `Schedule PATCH mismatch. Expected: ${JSON.stringify(updatedProps)}, Got: ${JSON.stringify(got)}`,
      );
    }
    ctx.log(`PATCH verified: displayName updated, timeIntervals preserved`);
  }

  // --- delete → second delete on stale refs must succeed ---
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
        original: updatedProps,
      },
    ],
  });
  ctx.log(`Deleted schedule — now applying second delete with stale refs`);

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
        original: updatedProps,
      },
    ],
  });
  ctx.log(`Stale delete succeeded — idempotent delete for schedule confirmed`);
};

// ----------------------------------------------------------------
// testAccessRuleIdempotence
//   Requires ≥2 readers; skipped otherwise.
//   1. create prereq persons + schedules
//   2. create access rule
//   3. re-merge with identical props  → same refs (no duplicate)
//   4. PATCH: change displayName only → same refs, describe verifies
//      only displayName changed (TAG_ACCESS_PROPS)
//   5. delete → second delete on stale refs → must succeed
// ----------------------------------------------------------------

const testAccessRuleIdempotence = async (ctx: ScenarioContext) => {
  const devicesResponse = await ctx.getReply({
    kind: "get-available-devices",
    provider: ctx.provider,
  });

  const readers = devicesResponse.devices.filter((d) => d.type === "reader");
  if (readers.length < 2) {
    ctx.log(
      `Less than 2 readers found — skipping access rule idempotence test`,
    );
    return;
  }
  const [reader1, reader2] = readers;

  // Minimal helpers that create objects and register their own cleanups
  const createPerson = async () => {
    const id = v4();
    const p = newPerson([]);
    const r = await ctx.getReply({
      kind: "apply-change",
      provider: ctx.provider,
      refMap: { person: { [id]: [] } },
      devices: {},
      mutations: [
        {
          kind: "merge",
          objectId: id,
          objectKind: "person",
          original: p,
          props: p,
        },
      ],
    });
    const refs = r.refs.person?.[id] ?? [];
    if (refs.length < 1) {
      throw new Error(`createPerson: expected ≥1 ref, got ${refs.length}`);
    }
    ctx.registerCleanup(`person ${id}`, async () => {
      await ctx.getReply({
        kind: "apply-change",
        provider: ctx.provider,
        refMap: { person: { [id]: refs } },
        devices: {},
        mutations: [
          { kind: "delete", objectId: id, objectKind: "person", original: p },
        ],
      });
    });
    return { awareId: id, refs, props: p };
  };

  const createSchedule = async () => {
    const id = v4();
    const p = newSchedule();
    const r = await ctx.getReply({
      kind: "apply-change",
      provider: ctx.provider,
      refMap: { schedule: { [id]: [] } },
      devices: {},
      mutations: [
        {
          kind: "merge",
          objectId: id,
          objectKind: "schedule",
          original: p,
          props: p,
        },
      ],
    });
    const refs = r.refs.schedule?.[id] ?? [];
    if (refs.length < 1) {
      throw new Error(`createSchedule: expected ≥1 ref, got ${refs.length}`);
    }
    ctx.registerCleanup(`schedule ${id}`, async () => {
      await ctx.getReply({
        kind: "apply-change",
        provider: ctx.provider,
        refMap: { schedule: { [id]: refs } },
        devices: {},
        mutations: [
          { kind: "delete", objectId: id, objectKind: "schedule", original: p },
        ],
      });
    });
    return { awareId: id, refs, props: p };
  };

  const p1 = await createPerson();
  const p2 = await createPerson();
  const s1 = await createSchedule();
  const s2 = await createSchedule();

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

  // --- create access rule ---
  const r1 = await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: { accessRule: { [ruleId]: [] }, ...dependentRefMap },
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
  const ruleRefs = r1.refs.accessRule?.[ruleId] ?? [];
  if (ruleRefs.length < 1) {
    throw new Error(
      `testAccessRuleIdempotence: expected ≥1 ref after create, got ${ruleRefs.length}`,
    );
  }
  ctx.log(`Created access rule with ${ruleRefs.length} ref(s)`);

  ctx.registerCleanup(`accessRule ${ruleId}`, async () => {
    await ctx.getReply({
      kind: "apply-change",
      provider: ctx.provider,
      refMap: { accessRule: { [ruleId]: ruleRefs }, ...dependentRefMap },
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

  // --- re-merge with identical props → same refs, no duplicate ---
  const r2 = await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: { accessRule: { [ruleId]: ruleRefs }, ...dependentRefMap },
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
  const ruleRefs2 = r2.refs.accessRule?.[ruleId] ?? [];
  if (ruleRefs2.length > 0 && !refsEqual(ruleRefs, ruleRefs2)) {
    throw new Error(
      `Re-merge with identical props created a duplicate: original [${ruleRefs}], got [${ruleRefs2}]`,
    );
  }
  ctx.log(
    `Re-merge with identical props did not create a new ref — no duplicate created`,
  );

  // --- PATCH: change displayName only ---
  const updatedRuleProps: ExternalAccessRuleProps = {
    ...ruleProps,
    displayName: uniqueName(),
  };
  const r3 = await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: { accessRule: { [ruleId]: ruleRefs }, ...dependentRefMap },
    devices,
    mutations: [
      {
        kind: "merge",
        objectId: ruleId,
        objectKind: "accessRule",
        original: ruleProps,
        props: updatedRuleProps,
      },
    ],
  });
  const ruleRefs3 = r3.refs.accessRule?.[ruleId] ?? [];
  if (ruleRefs3.length > 0 && !refsEqual(ruleRefs, ruleRefs3)) {
    throw new Error(
      `PATCH merge created a new ref — expected [${ruleRefs}] or none, got [${ruleRefs3}]`,
    );
  }
  ctx.log(`PATCH update did not create a new ref`);

  if (ctx.tags.includes(TAG_ACCESS_PROPS)) {
    const dr = await ctx.getReply({
      kind: "describe-object",
      provider: ctx.provider,
      objectKind: "accessRule",
      objectAssignedRef: ruleRefs.join(","),
    });
    if (dr.object === null) {
      throw new Error(`describe-object returned null after PATCH update`);
    }

    // The third party returns its own local refs, not Aware IDs — normalize before comparing
    const normalizedRuleProps: ExternalAccessRuleProps = {
      ...updatedRuleProps,
      appliedTo: [p1.refs.join(","), p2.refs.join(",")],
      permissions: [
        { deviceId: reader1.foreignRef, scheduleId: s1.refs.join(",") },
        { deviceId: reader2.foreignRef, scheduleId: s2.refs.join(",") },
      ],
    };

    const got = dr.object.data as ExternalAccessRuleProps;
    if (got.displayName !== updatedRuleProps.displayName) {
      throw new Error(
        `PATCH did not update displayName: expected "${updatedRuleProps.displayName}", got "${got.displayName}"`,
      );
    }
    if (!rulesMatch(got, normalizedRuleProps)) {
      throw new Error(
        `AccessRule PATCH mismatch. Expected: ${JSON.stringify(normalizedRuleProps)}, Got: ${JSON.stringify(got)}`,
      );
    }
    ctx.log(
      `PATCH verified: displayName updated, appliedTo and permissions preserved`,
    );
  }

  // --- delete → second delete on stale refs must succeed ---
  await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: { accessRule: { [ruleId]: ruleRefs }, ...dependentRefMap },
    devices,
    mutations: [
      {
        kind: "delete",
        objectId: ruleId,
        objectKind: "accessRule",
        original: updatedRuleProps,
      },
    ],
  });
  ctx.log(`Deleted access rule — now applying second delete with stale refs`);

  await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: { accessRule: { [ruleId]: ruleRefs }, ...dependentRefMap },
    devices,
    mutations: [
      {
        kind: "delete",
        objectId: ruleId,
        objectKind: "accessRule",
        original: updatedRuleProps,
      },
    ],
  });
  ctx.log(
    `Stale delete succeeded — idempotent delete for access rule confirmed`,
  );
};

// ----------------------------------------------------------------
// Scenario definition
// ----------------------------------------------------------------

const s: Scenario = {
  tags: [TAG_ACCESS],
  name: "Access Sync: Idempotence",
  description:
    "Verifies that (1) deleting non-existing refs succeeds, (2) re-merging an object with identical props does not create duplicates, and (3) merges behave PATCH-like: only changed fields are updated and refs remain stable",
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
      ctx.log(`Testing person idempotence...`);
      await testPersonIdempotence(ctx);
    }

    if (accessObjects.includes("schedule")) {
      ctx.log(`Testing schedule idempotence...`);
      await testScheduleIdempotence(ctx);
    }

    if (accessObjects.includes("accessRule")) {
      ctx.log(`Testing access rule idempotence...`);
      await testAccessRuleIdempotence(ctx);
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
