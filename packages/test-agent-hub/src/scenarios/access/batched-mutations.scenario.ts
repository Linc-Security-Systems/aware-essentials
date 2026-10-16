import { v4 } from "uuid";
import {
  AccessMutation,
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
  assertRuleDescribed,
  createTestPerson,
  createTestRule,
  describeObject,
  getReaders,
  newPerson,
  newSchedule,
  personsMatch,
  refsEqual,
  RefMap,
  schedulesMatch,
  supportsCustomSchedules,
  trackPersonCleanup,
} from "./_utils";

// ----------------------------------------------------------------
// testBatchCreate — one apply-change carrying several new objects of
//   different kinds, as Aware sends when it resyncs objects the agent
//   reported as BAD_REFERENCE / NOT_FOUND. Every object must get its
//   own refs, and people must not share refs.
// ----------------------------------------------------------------

const testBatchCreate = async (ctx: ScenarioContext) => {
  const custom = supportsCustomSchedules(ctx);
  const people = [0, 1, 2].map(() => ({
    awareId: v4(),
    state: {
      props: newPerson([]) as ExternalPersonProps,
      refs: [] as string[],
    },
  }));
  const schedule = custom
    ? { awareId: v4(), props: newSchedule() as ExternalScheduleProps }
    : null;

  const mutations: AccessMutation[] = [
    ...(schedule
      ? [
          {
            kind: "merge" as const,
            objectId: schedule.awareId,
            objectKind: "schedule" as const,
            original: schedule.props,
            props: schedule.props,
          },
        ]
      : []),
    ...people.map((p) => ({
      kind: "merge" as const,
      objectId: p.awareId,
      objectKind: "person" as const,
      original: p.state.props,
      props: p.state.props,
    })),
  ];
  const request = {
    provider: ctx.provider,
    refMap: {
      person: Object.fromEntries(people.map((p) => [p.awareId, []])),
      ...(schedule ? { schedule: { [schedule.awareId]: [] } } : {}),
    },
    devices: {},
    mutations,
  };

  const validateResult = await ctx.getReply({
    kind: "validate-change",
    ...request,
  });
  if (validateResult.issues.length > 0) {
    throw new Error(
      `Batch create: expected 0 issues, got ${validateResult.issues.length}: ${JSON.stringify(validateResult.issues)}`,
    );
  }

  const applyResult = await ctx.getReply({ kind: "apply-change", ...request });

  let scheduleRefs: string[] = [];
  if (schedule) {
    scheduleRefs = applyResult.refs.schedule?.[schedule.awareId] ?? [];
    // register cleanup before failing so nothing is left behind
    if (scheduleRefs.length > 0) {
      ctx.registerCleanup(`schedule ${schedule.awareId}`, async () => {
        await ctx.getReply({
          kind: "apply-change",
          provider: ctx.provider,
          refMap: { schedule: { [schedule.awareId]: scheduleRefs } },
          devices: {},
          mutations: [
            {
              kind: "delete",
              objectId: schedule.awareId,
              objectKind: "schedule",
              original: schedule.props,
            },
          ],
        });
      });
    }
  }
  for (const p of people) {
    p.state.refs = applyResult.refs.person?.[p.awareId] ?? [];
    if (p.state.refs.length > 0) {
      trackPersonCleanup(ctx, p.awareId, p.state);
    }
  }

  const missing = [
    ...(schedule && scheduleRefs.length < 1
      ? [`schedule ${schedule.awareId}`]
      : []),
    ...people
      .filter((p) => p.state.refs.length < 1)
      .map((p) => `person ${p.awareId}`),
  ];
  if (missing.length > 0) {
    throw new Error(
      `Batch create: no refs returned for ${missing.join(", ")}. Got: ${JSON.stringify(applyResult.refs)}`,
    );
  }

  const allPersonRefs = people.flatMap((p) => p.state.refs);
  if (new Set(allPersonRefs).size !== allPersonRefs.length) {
    throw new Error(
      `Batch create: people share refs: ${JSON.stringify(people.map((p) => p.state.refs))}`,
    );
  }
  ctx.log(
    `Batch create of ${mutations.length} objects returned refs for each of them`,
  );

  if (ctx.tags.includes(TAG_ACCESS_PROPS)) {
    for (const p of people) {
      const got = (await describeObject(
        ctx,
        "person",
        p.state.refs,
      )) as ExternalPersonProps;
      if (
        !personsMatch({ provider: got, aware: p.state.props, warn: ctx.warn })
      ) {
        throw new Error(
          `Batch create: person mismatch. Expected: ${JSON.stringify(p.state.props)}, Got: ${JSON.stringify(got)}`,
        );
      }
    }
    if (schedule) {
      const got = (await describeObject(
        ctx,
        "schedule",
        scheduleRefs,
      )) as ExternalScheduleProps;
      if (!schedulesMatch(got, schedule.props)) {
        throw new Error(
          `Batch create: schedule mismatch. Expected: ${JSON.stringify(schedule.props)}, Got: ${JSON.stringify(got)}`,
        );
      }
    }
    ctx.log(`Batch create: every object described as sent`);
  }
};

// ----------------------------------------------------------------
// testMovePersonBetweenRules — a person belongs to one access rule
//   at a time, so Aware removes them from their old rule in the same
//   batch that adds them to a new one:
//   1. rule A applied to p1 + p2
//   2. create rule B with p2 (add-access-rule):
//        [merge A {appliedTo: [p1]}, merge B (full)]
//   3. edit A to take p2 back (update-access-rule):
//        [merge B {appliedTo: []}, merge A {appliedTo: [p1, p2], lastModifiedOn}]
// ----------------------------------------------------------------

const testMovePersonBetweenRules = async (ctx: ScenarioContext) => {
  const readers = await getReaders(ctx, 1);
  if (readers.length < 1) {
    ctx.log(`No readers found — skipping move between rules test`);
    return;
  }

  const p1 = await createTestPerson(ctx, newPerson([]));
  const p2 = await createTestPerson(ctx, newPerson([]));
  const ruleA = await createTestRule(ctx, [p1, p2], readers);
  ctx.log(`Created rule A applied to p1 + p2`);

  // Rule B is created by the batch itself; reuse createTestRule's
  // schedules/devices shape by building it from rule A's grants
  const ruleBId = v4();
  const ruleB = {
    ruleId: ruleBId,
    state: {
      props: {
        ...ruleA.state.props,
        displayName: `B-${v4()}`,
        appliedTo: [p2.awareId],
      },
      refs: [] as string[],
    },
    dependencyRefs: ruleA.dependencyRefs,
    devices: ruleA.devices,
    toProviderRefs: ruleA.toProviderRefs,
  };

  const batch = async (
    label: string,
    mutations: AccessMutation[],
  ): Promise<RefMap> => {
    const request = {
      provider: ctx.provider,
      refMap: {
        ...ruleA.dependencyRefs,
        accessRule: {
          [ruleA.ruleId]: ruleA.state.refs,
          [ruleB.ruleId]: ruleB.state.refs,
        },
      },
      devices: ruleA.devices,
      mutations,
    };
    const validateResult = await ctx.getReply({
      kind: "validate-change",
      ...request,
    });
    if (validateResult.issues.length > 0) {
      throw new Error(
        `${label}: expected 0 issues, got ${validateResult.issues.length}: ${JSON.stringify(validateResult.issues)}`,
      );
    }
    const r = await ctx.getReply({ kind: "apply-change", ...request });
    return r.refs as RefMap;
  };

  // A provider may map one access rule to several objects, so rule refs can
  // legitimately change on update — adopt them (empty means updated in place)
  const adoptRuleRefs = (
    label: string,
    refs: RefMap,
    rule: { ruleId: string; state: { refs: string[] } },
    required: boolean,
  ) => {
    const newRefs = refs.accessRule?.[rule.ruleId] ?? [];
    if (newRefs.length > 0 && !refsEqual(newRefs, rule.state.refs)) {
      rule.state.refs = newRefs;
    }
    if (required && rule.state.refs.length < 1) {
      throw new Error(`${label}: no refs returned for new rule ${rule.ruleId}`);
    }
  };

  // --- 2. create rule B with p2, removing p2 from rule A ---
  const createB = "Create rule B taking p2 from rule A";
  const refs1 = await batch(createB, [
    {
      kind: "merge",
      objectId: ruleA.ruleId,
      objectKind: "accessRule",
      original: ruleA.state.props,
      props: { appliedTo: [p1.awareId] },
    },
    {
      kind: "merge",
      objectId: ruleB.ruleId,
      objectKind: "accessRule",
      original: ruleB.state.props,
      props: ruleB.state.props,
    },
  ]);
  ruleA.state.props = { ...ruleA.state.props, appliedTo: [p1.awareId] };
  adoptRuleRefs(createB, refs1, ruleA, false);
  adoptRuleRefs(createB, refs1, ruleB, false);
  if (ruleB.state.refs.length > 0) {
    ctx.registerCleanup(`accessRule ${ruleB.ruleId}`, async () => {
      await ctx.getReply({
        kind: "apply-change",
        provider: ctx.provider,
        refMap: {
          ...ruleB.dependencyRefs,
          accessRule: { [ruleB.ruleId]: ruleB.state.refs },
        },
        devices: ruleB.devices,
        mutations: [
          {
            kind: "delete",
            objectId: ruleB.ruleId,
            objectKind: "accessRule",
            original: ruleB.state.props,
          },
        ],
      });
    });
  }
  adoptRuleRefs(createB, refs1, ruleB, true);
  ctx.log(`${createB}: applied`);

  if (ctx.tags.includes(TAG_ACCESS_PROPS)) {
    await assertRuleDescribed(ctx, `${createB} (rule A)`, ruleA);
    await assertRuleDescribed(ctx, `${createB} (rule B)`, ruleB);
    ctx.log(`${createB}: rule A has p1, rule B has p2`);
  }

  // --- 3. edit rule A to take p2 back, leaving rule B empty ---
  const editA = "Edit rule A taking p2 back from rule B";
  const refs2 = await batch(editA, [
    {
      kind: "merge",
      objectId: ruleB.ruleId,
      objectKind: "accessRule",
      original: ruleB.state.props,
      props: { appliedTo: [] },
    },
    {
      kind: "merge",
      objectId: ruleA.ruleId,
      objectKind: "accessRule",
      original: ruleA.state.props,
      props: {
        appliedTo: [p1.awareId, p2.awareId],
        lastModifiedOn: new Date().toISOString(),
      } as Record<string, unknown>,
    } as AccessMutation,
  ]);
  ruleB.state.props = { ...ruleB.state.props, appliedTo: [] };
  ruleA.state.props = {
    ...ruleA.state.props,
    appliedTo: [p1.awareId, p2.awareId],
  };
  adoptRuleRefs(editA, refs2, ruleA, false);
  adoptRuleRefs(editA, refs2, ruleB, false);
  ctx.log(`${editA}: applied`);

  if (ctx.tags.includes(TAG_ACCESS_PROPS)) {
    await assertRuleDescribed(ctx, `${editA} (rule A)`, ruleA);
    await assertRuleDescribed(ctx, `${editA} (rule B)`, ruleB);
    ctx.log(`${editA}: rule A has p1 + p2, rule B has nobody`);
  }
};

// ----------------------------------------------------------------
// Scenario definition
// ----------------------------------------------------------------

const s: Scenario = {
  tags: [TAG_ACCESS],
  name: "Access Sync: Applies batches of several mutations",
  description:
    "Verifies that validate-change / apply-change requests carrying several mutations, as Aware sends on resync and when moving a person between access rules, are applied in full",
  run: async (ctx) => {
    let skipped: string | undefined;

    await ctx.getReply({
      kind: "start",
      provider: ctx.provider,
      config: ctx.config,
      lastEventForeignRef: null,
      lastEventTimestamp: null,
    });

    const accessObjects = accessObjectsOf(ctx);

    if (accessObjects.includes("person")) {
      ctx.log(`Testing batch create...`);
      await testBatchCreate(ctx);

      if (accessObjects.includes("accessRule")) {
        ctx.log(`Testing moving a person between rules...`);
        await testMovePersonBetweenRules(ctx);
      }
    } else {
      skipped = `Provider does not support 'person'`;
    }

    await ctx.runCleanups();

    await ctx.getReply({
      kind: "stop",
      provider: ctx.provider,
    });

    return skipped ? scenarioSkip(skipped) : scenarioPass();
  },
};

export default s;
