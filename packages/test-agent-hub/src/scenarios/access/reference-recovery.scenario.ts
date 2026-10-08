import { v4 } from "uuid";
import {
  AccessChangeIssue,
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
} from "../../scenario.types";
import {
  accessObjectsOf,
  createTestSchedule,
  Devices,
  getReaders,
  newPerson,
  newRule,
  newSchedule,
  personDtoExtras,
  RefMap,
  supportsCustomSchedules,
  trackPersonCleanup,
} from "./_utils";

// Aware recovers from these codes by re-creating the object the issue points
// at (command-server.service.ts). It can only do so when the issue carries
// objectKind and objectId — anything else is shown to the user as an error.
const RECOVERABLE = ["BAD_REFERENCE", "NOT_FOUND"];

type Missing = { objectKind: "person" | "schedule"; objectId: string };

const describeIssues = (issues: AccessChangeIssue[]) => JSON.stringify(issues);

// Every expected object must be reported by a recoverable issue that names it,
// and no issue may be unrecoverable
const assertRecoverableIssues = (
  label: string,
  issues: AccessChangeIssue[],
  expected: Missing[],
) => {
  const unrecoverable = issues.filter(
    (i) => !i.code || !RECOVERABLE.includes(i.code),
  );
  if (unrecoverable.length > 0) {
    throw new Error(
      `${label}: expected only ${RECOVERABLE.join("/")} issues, got: ${describeIssues(issues)}`,
    );
  }
  const notReported = expected.filter(
    (e) =>
      !issues.some(
        (i) => i.objectKind === e.objectKind && i.objectId === e.objectId,
      ),
  );
  if (notReported.length > 0) {
    throw new Error(
      `${label}: no issue with objectKind + objectId for ${notReported
        .map((e) => `${e.objectKind} ${e.objectId}`)
        .join(
          ", ",
        )} — Aware cannot recover without them. Got: ${describeIssues(issues)}`,
    );
  }
};

// ----------------------------------------------------------------
// resync — what Aware does on recoverable issues: forget the refs of
//   the reported objects, then send one apply-change re-creating all
//   of them, with the whole DTO as props (ResyncAdd)
// ----------------------------------------------------------------

const resync = async (
  ctx: ScenarioContext,
  objects: {
    person: {
      awareId: string;
      state: { props: ExternalPersonProps; refs: string[] };
    }[];
    schedule: {
      awareId: string;
      props: ExternalScheduleProps;
      refs: string[];
    }[];
  },
) => {
  const mutations: AccessMutation[] = [
    ...objects.schedule.map((s) => ({
      kind: "merge" as const,
      objectId: s.awareId,
      objectKind: "schedule" as const,
      original: s.props,
      props: s.props,
    })),
    ...objects.person.map(
      (p) =>
        ({
          kind: "merge",
          objectId: p.awareId,
          objectKind: "person",
          original: p.state.props,
          props: { ...p.state.props, ...personDtoExtras(ctx.provider) },
        }) as AccessMutation,
    ),
  ];
  const r = await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: {
      person: Object.fromEntries(objects.person.map((p) => [p.awareId, []])),
      schedule: Object.fromEntries(
        objects.schedule.map((s) => [s.awareId, []]),
      ),
    },
    devices: {},
    mutations,
  });

  for (const p of objects.person) {
    p.state.refs = r.refs.person?.[p.awareId] ?? [];
    if (p.state.refs.length > 0) trackPersonCleanup(ctx, p.awareId, p.state);
  }
  for (const s of objects.schedule) {
    s.refs = r.refs.schedule?.[s.awareId] ?? [];
    if (s.refs.length > 0) {
      ctx.registerCleanup(`schedule ${s.awareId}`, async () => {
        await ctx.getReply({
          kind: "apply-change",
          provider: ctx.provider,
          refMap: { schedule: { [s.awareId]: s.refs } },
          devices: {},
          mutations: [
            {
              kind: "delete",
              objectId: s.awareId,
              objectKind: "schedule",
              original: s.props,
            },
          ],
        });
      });
    }
  }

  const missing = [
    ...objects.person
      .filter((p) => p.state.refs.length < 1)
      .map((p) => `person ${p.awareId}`),
    ...objects.schedule
      .filter((s) => s.refs.length < 1)
      .map((s) => `schedule ${s.awareId}`),
  ];
  if (missing.length > 0) {
    throw new Error(
      `Resync: no refs returned for ${missing.join(", ")}. Got: ${JSON.stringify(r.refs)}`,
    );
  }
};

// ----------------------------------------------------------------
// testStaleObjectRef — a merge for a person (and a custom schedule)
//   whose stored ref no longer exists in the third party:
//   validate → recoverable issue naming the object → resync →
//   re-validate with the new refs → 0 issues
// ----------------------------------------------------------------

const testStaleObjectRef = async (ctx: ScenarioContext) => {
  const person = {
    awareId: v4(),
    state: { props: newPerson([]) as ExternalPersonProps, refs: ["999999991"] },
  };
  const schedule = supportsCustomSchedules(ctx)
    ? {
        awareId: v4(),
        props: newSchedule() as ExternalScheduleProps,
        refs: ["999999992"],
      }
    : null;

  const request = () => ({
    provider: ctx.provider,
    refMap: {
      person: { [person.awareId]: person.state.refs },
      ...(schedule ? { schedule: { [schedule.awareId]: schedule.refs } } : {}),
    },
    devices: {},
    mutations: [
      {
        kind: "merge" as const,
        objectId: person.awareId,
        objectKind: "person" as const,
        original: person.state.props,
        props: { firstName: person.state.props.firstName },
      },
      ...(schedule
        ? [
            {
              kind: "merge" as const,
              objectId: schedule.awareId,
              objectKind: "schedule" as const,
              original: schedule.props,
              props: { displayName: schedule.props.displayName },
            },
          ]
        : []),
    ],
  });

  const label = "Stale refs";
  const v1 = await ctx.getReply({ kind: "validate-change", ...request() });
  assertRecoverableIssues(label, v1.issues, [
    { objectKind: "person", objectId: person.awareId },
    ...(schedule
      ? [{ objectKind: "schedule" as const, objectId: schedule.awareId }]
      : []),
  ]);
  ctx.log(`${label}: reported as recoverable, naming each object`);

  await resync(ctx, {
    person: [person],
    schedule: schedule ? [schedule] : [],
  });
  ctx.log(`${label}: resync re-created the objects`);

  const v2 = await ctx.getReply({ kind: "validate-change", ...request() });
  if (v2.issues.length > 0) {
    throw new Error(
      `${label}: expected 0 issues after resync, got: ${describeIssues(v2.issues)}`,
    );
  }
  await ctx.getReply({ kind: "apply-change", ...request() });
  ctx.log(`${label}: original change validated and applied after resync`);
};

// ----------------------------------------------------------------
// testRuleWithMissingDependencies — a new access rule pointing at
//   people (and a custom schedule) the agent has no refs for, the way
//   Aware sends it (empty ref arrays): validate → recoverable issue
//   per missing object → resync them in one batch → re-validate →
//   apply the rule
// ----------------------------------------------------------------

const testRuleWithMissingDependencies = async (ctx: ScenarioContext) => {
  const readers = await getReaders(ctx, 1);
  const custom = supportsCustomSchedules(ctx);

  const people = [0, 1].map(() => ({
    awareId: v4(),
    state: {
      props: newPerson([]) as ExternalPersonProps,
      refs: [] as string[],
    },
  }));

  // fixed-schedule providers can't be missing a built-in schedule, so the
  // rule uses an existing one; custom-schedule providers get a missing one
  const missingSchedule =
    readers.length > 0 && custom
      ? {
          awareId: v4(),
          props: newSchedule() as ExternalScheduleProps,
          refs: [] as string[],
        }
      : null;
  const existingSchedule =
    readers.length > 0 && !custom
      ? await createTestSchedule(ctx, "always")
      : null;
  const scheduleId = missingSchedule?.awareId ?? existingSchedule?.awareId;
  const readerId = v4();

  const ruleId = v4();
  const ruleProps: ExternalAccessRuleProps = {
    ...newRule(),
    appliedTo: people.map((p) => p.awareId),
    permissions:
      readers.length > 0 && scheduleId
        ? [{ deviceId: readerId, scheduleId }]
        : [],
    groupPermissions: [],
  };
  const devices: Devices =
    readers.length > 0
      ? {
          [readerId]: { ...readers[0].providerMetadata } as Record<
            string,
            unknown
          >,
        }
      : {};

  const ruleState = { refs: [] as string[] };
  const request = () => {
    const refMap: RefMap = {
      accessRule: { [ruleId]: ruleState.refs },
      person: Object.fromEntries(people.map((p) => [p.awareId, p.state.refs])),
    };
    if (missingSchedule) {
      refMap.schedule = { [missingSchedule.awareId]: missingSchedule.refs };
    }
    if (existingSchedule) {
      refMap.schedule = { [existingSchedule.awareId]: existingSchedule.refs };
    }
    if (readers.length > 0) {
      refMap.device = { [readerId]: [readers[0].foreignRef] };
    }
    return {
      provider: ctx.provider,
      refMap,
      devices,
      mutations: [
        {
          kind: "merge" as const,
          objectId: ruleId,
          objectKind: "accessRule" as const,
          original: ruleProps,
          props: ruleProps,
        },
      ],
    };
  };

  const label = "Rule with missing dependencies";
  const v1 = await ctx.getReply({ kind: "validate-change", ...request() });
  assertRecoverableIssues(label, v1.issues, [
    ...people.map((p) => ({
      objectKind: "person" as const,
      objectId: p.awareId,
    })),
    ...(missingSchedule
      ? [{ objectKind: "schedule" as const, objectId: missingSchedule.awareId }]
      : []),
  ]);
  ctx.log(
    `${label}: reported ${v1.issues.length} recoverable issue(s), naming each missing object`,
  );

  await resync(ctx, {
    person: people,
    schedule: missingSchedule ? [missingSchedule] : [],
  });
  ctx.log(`${label}: resync re-created the missing objects in one batch`);

  const v2 = await ctx.getReply({ kind: "validate-change", ...request() });
  if (v2.issues.length > 0) {
    throw new Error(
      `${label}: expected 0 issues after resync, got: ${describeIssues(v2.issues)}`,
    );
  }

  const applied = await ctx.getReply({ kind: "apply-change", ...request() });
  ruleState.refs = applied.refs.accessRule?.[ruleId] ?? [];
  if (ruleState.refs.length < 1) {
    throw new Error(`${label}: no refs returned for the rule after resync`);
  }
  ctx.registerCleanup(`accessRule ${ruleId}`, async () => {
    await ctx.getReply({
      kind: "apply-change",
      ...request(),
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
  ctx.log(`${label}: rule applied after resync`);
};

// ----------------------------------------------------------------
// Scenario definition
// ----------------------------------------------------------------

const s: Scenario = {
  tags: [TAG_ACCESS],
  name: "Access Sync: Reports recoverable issues Aware can resync from",
  description:
    "Verifies that BAD_REFERENCE / NOT_FOUND issues carry objectKind and objectId, and that the change validates and applies once Aware has resynced the reported objects",
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
      ctx.log(`Testing stale object refs...`);
      await testStaleObjectRef(ctx);

      if (accessObjects.includes("accessRule")) {
        ctx.log(`Testing access rule with missing dependencies...`);
        await testRuleWithMissingDependencies(ctx);
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
