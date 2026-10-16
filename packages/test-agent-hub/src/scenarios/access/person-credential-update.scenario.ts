import { v4 } from "uuid";
import {
  ExternalAccessRuleProps,
  ExternalPersonProps,
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
} from "./_utils";

// ----------------------------------------------------------------
// AssignedRule — the access rule (and its prerequisites) the person
//   is assigned to, kept so the rule can be re-verified after each
//   credential change
// ----------------------------------------------------------------

type AssignedRule = {
  ruleId: string;
  ruleRefs: string[];
  ruleProps: ExternalAccessRuleProps;
  // permissions as the provider describes them (its own refs)
  providerPermissions: ExternalAccessRuleProps["permissions"];
};

// ----------------------------------------------------------------
// createPerson — apply + register cleanup that deletes the person
//   using whatever props are current at cleanup time
// ----------------------------------------------------------------

const createPerson = async (ctx: ScenarioContext) => {
  const awareId = v4();
  const state = {
    props: newPerson([{ type: "card", value: "11223344" }]),
  };

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
  ctx.log(`Created person with 1 card credential and ${refs.length} ref(s)`);

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
// assignAccessRule — creates schedules and an access rule applied to
//   the person. With 2+ readers: reader1 + schedule1, reader2 +
//   schedule2; with a single reader: that reader + one schedule.
//   Providers without custom schedules get 'always' (and 'never' for
//   the second reader). Returns null when there are no readers.
// ----------------------------------------------------------------

const assignAccessRule = async (
  ctx: ScenarioContext,
  person: { awareId: string; refs: string[] },
): Promise<AssignedRule | null> => {
  const devicesResponse = await ctx.getReply({
    kind: "get-available-devices",
    provider: ctx.provider,
  });

  const readers = devicesResponse.devices
    .filter((d) => d.type === "reader")
    .slice(0, 2);
  if (readers.length < 1) {
    ctx.log(`No readers found — testing credential update without a rule`);
    return null;
  }
  ctx.log(`Using ${readers.length} reader(s), one schedule each`);

  // --- schedules ---
  const flags = ["always", "never"] as const;
  const grants = [];
  for (const [i, reader] of readers.entries()) {
    const schedule = await createTestSchedule(ctx, flags[i]);
    grants.push({ readerId: v4(), reader, schedule });
  }

  // --- access rule ---
  const ruleId = v4();
  const ruleProps: ExternalAccessRuleProps = {
    ...newRule(),
    appliedTo: [person.awareId],
    permissions: grants.map((g) => ({
      deviceId: g.readerId,
      scheduleId: g.schedule.awareId,
    })),
    groupPermissions: [],
  };
  const refMap = {
    accessRule: { [ruleId]: [] as string[] },
    person: { [person.awareId]: person.refs },
    schedule: Object.fromEntries(
      grants.map((g) => [g.schedule.awareId, g.schedule.refs]),
    ),
    device: Object.fromEntries(
      grants.map((g) => [g.readerId, [g.reader.foreignRef]]),
    ),
  };
  const devices: Record<string, Record<string, unknown>> = Object.fromEntries(
    grants.map((g) => [
      g.readerId,
      { ...g.reader.providerMetadata } as Record<string, unknown>,
    ]),
  );

  const rr = await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap,
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
  const ruleRefs = rr.refs.accessRule?.[ruleId] ?? [];
  if (ruleRefs.length < 1) {
    throw new Error(
      `assignAccessRule: expected ≥1 rule ref, got ${ruleRefs.length}`,
    );
  }
  ctx.log(`Assigned person to access rule with ${ruleRefs.length} ref(s)`);

  ctx.registerCleanup(`accessRule ${ruleId}`, async () => {
    await ctx.getReply({
      kind: "apply-change",
      provider: ctx.provider,
      refMap: { ...refMap, accessRule: { [ruleId]: ruleRefs } },
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

  return {
    ruleId,
    ruleRefs,
    ruleProps,
    providerPermissions: grants.map((g) => ({
      deviceId: g.reader.foreignRef,
      scheduleId: g.schedule.refs.join(","),
    })),
  };
};

// ----------------------------------------------------------------
// updateCredentials — validate + apply a person merge that changes
//   only credentials; verifies refs are stable, and (TAG_ACCESS_PROPS)
//   that the person has the new credentials and the rule is intact
// ----------------------------------------------------------------

const updateCredentials = async (
  ctx: ScenarioContext,
  person: {
    awareId: string;
    refs: string[];
    state: { props: ExternalPersonProps };
  },
  credentials: ExternalPersonProps["credentials"],
  rule: AssignedRule | null,
  label: string,
) => {
  const original = person.state.props;
  const updated: ExternalPersonProps = { ...original, credentials };

  const validateResult = await ctx.getReply({
    kind: "validate-change",
    provider: ctx.provider,
    refMap: { person: { [person.awareId]: person.refs } },
    devices: {},
    mutations: [
      {
        kind: "merge",
        objectId: person.awareId,
        objectKind: "person",
        original,
        props: updated,
      },
    ],
  });
  if (validateResult.issues.length > 0) {
    throw new Error(
      `${label}: expected 0 validation issues, got ${validateResult.issues.length}: ${JSON.stringify(validateResult.issues)}`,
    );
  }
  ctx.log(`${label}: validation passed with 0 issues`);

  const r = await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: { person: { [person.awareId]: person.refs } },
    devices: {},
    mutations: [
      {
        kind: "merge",
        objectId: person.awareId,
        objectKind: "person",
        original,
        props: updated,
      },
    ],
  });
  person.state.props = updated;

  // Empty refs on an update means the agent updated in-place — that is success.
  const newRefs = r.refs.person?.[person.awareId] ?? [];
  if (newRefs.length > 0 && !refsEqual(person.refs, newRefs)) {
    throw new Error(
      `${label}: person refs changed — expected [${person.refs}] or none, got [${newRefs}]`,
    );
  }
  ctx.log(`${label}: apply succeeded, person refs unchanged`);

  if (!ctx.tags.includes(TAG_ACCESS_PROPS)) return;

  const pr = await ctx.getReply({
    kind: "describe-object",
    provider: ctx.provider,
    objectKind: "person",
    objectAssignedRef: person.refs.join(","),
  });
  if (pr.object === null) {
    throw new Error(`${label}: describe-object returned null for person`);
  }
  if (
    !personsMatch({
      provider: pr.object.data as ExternalPersonProps,
      aware: updated,
      warn: ctx.warn,
    })
  ) {
    throw new Error(
      `${label}: person mismatch. Expected: ${JSON.stringify(updated)}, Got: ${JSON.stringify(pr.object.data)}`,
    );
  }
  ctx.log(`${label}: person credentials verified`);

  if (!rule) return;

  const rr = await ctx.getReply({
    kind: "describe-object",
    provider: ctx.provider,
    objectKind: "accessRule",
    objectAssignedRef: rule.ruleRefs.join(","),
  });
  if (rr.object === null) {
    throw new Error(`${label}: describe-object returned null for access rule`);
  }

  // The third party returns its own local refs, not Aware IDs — normalize before comparing
  const normalizedRuleProps: ExternalAccessRuleProps = {
    ...rule.ruleProps,
    appliedTo: [person.refs.join(",")],
    permissions: rule.providerPermissions,
  };
  if (
    !rulesMatch(rr.object.data as ExternalAccessRuleProps, normalizedRuleProps)
  ) {
    throw new Error(
      `${label}: access rule changed after credential update. Expected: ${JSON.stringify(normalizedRuleProps)}, Got: ${JSON.stringify(rr.object.data)}`,
    );
  }
  ctx.log(`${label}: access rule still applied to person`);
};

// ----------------------------------------------------------------
// Scenario definition
//   1. create person with one card
//   2. assign them to an access rule (when supported + readers exist;
//      always/never schedules for providers without custom schedules)
//   3. add a second card and a pin  → validate, apply, verify
//   4. remove the original card     → validate, apply, verify
// ----------------------------------------------------------------

const s: Scenario = {
  tags: [TAG_ACCESS],
  name: "Access Sync: Updates credentials of an existing person",
  description:
    "Verifies that credentials can be added to and removed from an existing person who is assigned to an access rule, without changing refs or breaking the rule",
  run: async (ctx) => {
    let skipped: string | undefined;

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
      const person = await createPerson(ctx);

      const rule = accessObjects.includes("accessRule")
        ? await assignAccessRule(ctx, person)
        : null;
      if (!rule) {
        ctx.log(`No access rule assigned — testing credential update alone`);
      }

      const [originalCard] = person.state.props.credentials;
      const addedCard = { type: "card" as const, value: "55667788" };
      const addedPin = { type: "pin" as const, value: "4321" };

      await updateCredentials(
        ctx,
        person,
        [originalCard, addedCard, addedPin],
        rule,
        "Add credentials",
      );

      await updateCredentials(
        ctx,
        person,
        [addedCard, addedPin],
        rule,
        "Remove credential",
      );
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
