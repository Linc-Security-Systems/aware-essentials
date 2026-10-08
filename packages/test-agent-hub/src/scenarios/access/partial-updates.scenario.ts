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
  scenarioSkip,
  TAG_ACCESS,
  TAG_ACCESS_PROPS,
} from "../../scenario.types";
import {
  createTestSchedule,
  newPerson,
  newRule,
  personsMatch,
  refsEqual,
  rulesMatch,
  schedulesMatch,
  uniqueName,
} from "./_utils";

type RefMap = Record<string, Record<string, string[]>>;
type Devices = Record<string, Record<string, unknown>>;

// ----------------------------------------------------------------
// partialUpdate — sends a merge the way Aware does on edit:
//   `original` = full current state, `props` = only the changed
//   fields plus `lastModifiedOn` (not in the schema — agents must
//   ignore unknown props). Array props (permissions, appliedTo, ...)
//   are sent whole and replace the previous value. Validates +
//   applies, checks refs (see below), then describes and compares against
//   { ...original, ...changes }, naming any field that was lost.
//   Returns the new full state for the next step.
// ----------------------------------------------------------------

const partialUpdate = async <T extends object>(
  ctx: ScenarioContext,
  opts: {
    objectKind: "person" | "schedule" | "accessRule";
    awareId: string;
    refs: string[];
    refMap: RefMap;
    devices: Devices;
    current: T;
    changes: Partial<T>;
    // maps Aware IDs inside the props to the provider's refs
    normalize?: (props: T) => T;
    match: (provider: T, expected: T) => boolean;
  },
): Promise<T> => {
  const { objectKind, awareId, refs, current, changes } = opts;
  const changed = Object.keys(changes) as (keyof T)[];
  const step = `Partial update of ${changed.join(", ")}`;

  const mutation = {
    kind: "merge",
    objectId: awareId,
    objectKind,
    original: current,
    props: { ...changes, lastModifiedOn: new Date().toISOString() },
  } as any;
  const request = {
    provider: ctx.provider,
    refMap: opts.refMap,
    devices: opts.devices,
    mutations: [mutation],
  };

  const validateResult = await ctx.getReply({
    kind: "validate-change",
    ...request,
  });
  if (validateResult.issues.length > 0) {
    throw new Error(
      `${step} (${objectKind}): expected 0 validation issues, got ${validateResult.issues.length}: ${JSON.stringify(validateResult.issues)}`,
    );
  }

  const applyResult = await ctx.getReply({ kind: "apply-change", ...request });
  // Empty refs on an update means the agent updated in-place — that is success.
  const newRefs = applyResult.refs[objectKind]?.[awareId] ?? [];
  let currentRefs = refs;
  if (newRefs.length > 0 && !refsEqual(refs, newRefs)) {
    // A provider may map one access rule to several objects (e.g. one access level per
    // schedule in Armatura), so its refs can legitimately change. Adopt the new refs
    // in the shared refMap so later steps and cleanup use them.
    if (objectKind !== "accessRule") {
      throw new Error(
        `${step} (${objectKind}) changed refs: expected [${refs}] or none, got [${newRefs}]`,
      );
    }
    opts.refMap[objectKind][awareId] = newRefs;
    currentRefs = newRefs;
    ctx.log(`${step} (${objectKind}): refs changed [${refs}] → [${newRefs}]`);
  }

  const updated = { ...current, ...changes };

  const dr = await ctx.getReply({
    kind: "describe-object",
    provider: ctx.provider,
    objectKind,
    objectAssignedRef: currentRefs.join(","),
  });
  if (dr.object === null) {
    throw new Error(`${step} (${objectKind}): describe-object returned null`);
  }

  const got = dr.object.data as T;
  const expected = opts.normalize ? opts.normalize(updated) : updated;
  // A missing field can make a matcher throw — treat that as a mismatch
  const matches = (provider: T) => {
    try {
      return opts.match(provider, expected);
    } catch {
      return false;
    }
  };
  if (!matches(got)) {
    // A field is wrong if the provider's value for it alone breaks the match
    const bad = (Object.keys(expected) as (keyof T)[]).filter(
      (f) => !matches({ ...expected, [f]: got[f] }),
    );
    const lost = bad.filter((f) => !changed.includes(f));
    const notApplied = bad.filter((f) => changed.includes(f));
    const problems = [
      lost.length > 0 ? `lost ${lost.join(", ")}` : "",
      notApplied.length > 0 ? `did not apply ${notApplied.join(", ")}` : "",
    ].filter(Boolean);
    throw new Error(
      `${step} (${objectKind}) ${problems.join(" and ") || "mismatch"}. Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(got)}`,
    );
  }
  ctx.log(`${step} (${objectKind}): other props preserved`);

  return updated;
};

// ----------------------------------------------------------------
// createPerson — apply + register cleanup that deletes the person
//   using whatever props are current at cleanup time
// ----------------------------------------------------------------

const createPerson = async (
  ctx: ScenarioContext,
  credentials: ExternalPersonProps["credentials"],
) => {
  const awareId = v4();
  const state = { props: newPerson(credentials) };

  const r = await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: { person: { [awareId]: [] } },
    devices: {},
    mutations: [
      {
        kind: "merge",
        objectId: awareId,
        objectKind: "person",
        original: state.props,
        props: state.props,
      },
    ],
  });
  const refs = r.refs.person?.[awareId] ?? [];
  if (refs.length < 1) {
    throw new Error(`createPerson: expected ≥1 ref, got ${refs.length}`);
  }

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
          original: state.props,
        },
      ],
    });
  });

  return { awareId, refs, state };
};

// ----------------------------------------------------------------
// testPersonPartialUpdates
//   create with a card → {firstName} → {credentials} → {validTo}
// ----------------------------------------------------------------

const testPersonPartialUpdates = async (ctx: ScenarioContext) => {
  const person = await createPerson(ctx, [{ type: "card", value: "24681357" }]);
  ctx.log(`Created person with 1 card`);

  const update = async (changes: Partial<ExternalPersonProps>) => {
    person.state.props = await partialUpdate(ctx, {
      objectKind: "person",
      awareId: person.awareId,
      refs: person.refs,
      refMap: { person: { [person.awareId]: person.refs } },
      devices: {},
      current: person.state.props,
      changes,
      match: (provider, aware) =>
        personsMatch({ provider, aware, warn: ctx.warn }),
    });
  };

  const validTo = new Date();
  validTo.setFullYear(validTo.getFullYear() + 2);

  await update({ firstName: uniqueName() });
  await update({
    credentials: [
      ...person.state.props.credentials,
      { type: "card", value: "13572468" },
    ],
  });
  await update({ validTo: validTo.toISOString() });
};

// ----------------------------------------------------------------
// testSchedulePartialUpdates (custom-schedule providers only)
//   create → {displayName} → {include}
// ----------------------------------------------------------------

const testSchedulePartialUpdates = async (ctx: ScenarioContext) => {
  const schedule = await createTestSchedule(ctx, "always");
  let current: ExternalScheduleProps = schedule.props;

  const update = async (changes: Partial<ExternalScheduleProps>) => {
    current = await partialUpdate(ctx, {
      objectKind: "schedule",
      awareId: schedule.awareId,
      refs: schedule.refs,
      refMap: { schedule: { [schedule.awareId]: schedule.refs } },
      devices: {},
      current,
      changes,
      match: schedulesMatch,
    });
  };

  await update({ displayName: uniqueName() });
  await update({
    include: {
      ...current.include,
      timeIntervals: [
        { weekDay: "tue", from: 90000, to: 180000 },
        { weekDay: "wed", from: 70000, to: 120000 },
      ],
    },
  });
};

// ----------------------------------------------------------------
// testAccessRulePartialUpdates (≥1 reader)
//   2+ readers: create with p1+p2, reader1/s1 + reader2/s2 →
//     {permissions: [reader1/s1]}
//   1 reader:   create with p1+p2, reader1/s1 →
//     {permissions: [reader1/s2]}
//   then → {displayName} → {appliedTo: [p1]}
// ----------------------------------------------------------------

const testAccessRulePartialUpdates = async (ctx: ScenarioContext) => {
  const devicesResponse = await ctx.getReply({
    kind: "get-available-devices",
    provider: ctx.provider,
  });

  const readers = devicesResponse.devices
    .filter((d) => d.type === "reader")
    .slice(0, 2);
  if (readers.length < 1) {
    ctx.log(`No readers found — skipping access rule partial update test`);
    return;
  }
  ctx.log(`Using ${readers.length} reader(s)`);

  const p1 = await createPerson(ctx, []);
  const p2 = await createPerson(ctx, []);
  // Fixed-schedule providers get 'always' + 'never' so the deny path is exercised
  const s1 = await createTestSchedule(ctx, "always");
  const s2 = await createTestSchedule(ctx, "never");

  const readerIds = readers.map(() => v4());
  const ruleId = v4();

  const dependentRefMap: RefMap = {
    person: { [p1.awareId]: p1.refs, [p2.awareId]: p2.refs },
    schedule: { [s1.awareId]: s1.refs, [s2.awareId]: s2.refs },
    device: Object.fromEntries(
      readers.map((reader, i) => [readerIds[i], [reader.foreignRef]]),
    ),
  };
  const devices: Devices = Object.fromEntries(
    readers.map((reader, i) => [
      readerIds[i],
      { ...reader.providerMetadata } as Record<string, unknown>,
    ]),
  );

  const scheduleIds = [s1.awareId, s2.awareId];
  const initialPermissions = readerIds.map((deviceId, i) => ({
    deviceId,
    scheduleId: scheduleIds[i],
  }));
  // Permissions-only edit: drop the second reader, or with a single
  // reader move it from s1 to s2
  const editedPermissions =
    readerIds.length > 1
      ? [initialPermissions[0]]
      : [{ deviceId: readerIds[0], scheduleId: s2.awareId }];

  const state: { props: ExternalAccessRuleProps } = {
    props: {
      ...newRule(),
      appliedTo: [p1.awareId, p2.awareId],
      permissions: initialPermissions,
      groupPermissions: [],
    },
  };

  const r = await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: { accessRule: { [ruleId]: [] }, ...dependentRefMap },
    devices,
    mutations: [
      {
        kind: "merge",
        objectId: ruleId,
        objectKind: "accessRule",
        original: state.props,
        props: state.props,
      },
    ],
  });
  const ruleRefs = r.refs.accessRule?.[ruleId] ?? [];
  if (ruleRefs.length < 1) {
    throw new Error(
      `testAccessRulePartialUpdates: expected ≥1 ref after create, got ${ruleRefs.length}`,
    );
  }
  ctx.log(
    `Created access rule with 2 people and ${initialPermissions.length} permission(s)`,
  );

  const refMap: RefMap = {
    accessRule: { [ruleId]: ruleRefs },
    ...dependentRefMap,
  };

  ctx.registerCleanup(`accessRule ${ruleId}`, async () => {
    await ctx.getReply({
      kind: "apply-change",
      provider: ctx.provider,
      refMap,
      devices,
      mutations: [
        {
          kind: "delete",
          objectId: ruleId,
          objectKind: "accessRule",
          original: state.props,
        },
      ],
    });
  });

  // The third party returns its own local refs, not Aware IDs — normalize before comparing
  const ref = (kind: string, id: string) => refMap[kind][id].join(",");
  const normalize = (props: ExternalAccessRuleProps) => ({
    ...props,
    appliedTo: props.appliedTo.map((id) => ref("person", id)),
    permissions: props.permissions.map((p) => ({
      deviceId: ref("device", p.deviceId),
      scheduleId: ref("schedule", p.scheduleId),
    })),
  });

  const update = async (changes: Partial<ExternalAccessRuleProps>) => {
    state.props = await partialUpdate(ctx, {
      objectKind: "accessRule",
      awareId: ruleId,
      refs: refMap.accessRule[ruleId],
      refMap,
      devices,
      current: state.props,
      changes,
      normalize,
      match: rulesMatch,
    });
  };

  // The exact edit that broke Inner Range: only permissions in props
  await update({ permissions: editedPermissions });
  await update({ displayName: uniqueName() });
  await update({ appliedTo: [p1.awareId] });
};

// ----------------------------------------------------------------
// Scenario definition
// ----------------------------------------------------------------

const s: Scenario = {
  tags: [TAG_ACCESS],
  name: "Access Sync: Partial updates preserve unchanged props",
  description:
    "Verifies that merges with partial props (only changed fields, plus unknown fields such as lastModifiedOn) and a full original, as Aware sends on edit, update only those fields and preserve the rest",
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

    let skipped: string | undefined;
    if (!ctx.tags.includes(TAG_ACCESS_PROPS)) {
      skipped = `${TAG_ACCESS_PROPS} tag not present — partial updates can only be verified via describe-object`;
    } else {
      if (accessObjects.includes("person")) {
        ctx.log(`Testing person partial updates...`);
        await testPersonPartialUpdates(ctx);
      }

      if (accessObjects.includes("schedule")) {
        ctx.log(`Testing schedule partial updates...`);
        await testSchedulePartialUpdates(ctx);
      }

      if (accessObjects.includes("accessRule")) {
        ctx.log(`Testing access rule partial updates...`);
        await testAccessRulePartialUpdates(ctx);
      }

      await ctx.runCleanups();
    }

    await ctx.getReply({
      kind: "stop",
      provider: ctx.provider,
    });

    return skipped ? scenarioSkip(skipped) : scenarioPass();
  },
};

export default s;
