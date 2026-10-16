import { v4 } from "uuid";
import {
  AccessMutation,
  ExternalPersonProps,
  ExternalScheduleProps,
  ExternalZoneProps,
  ExternalAccessRuleProps,
  FlagType,
} from "@awarevue/api-types";
import { ScenarioContext, TAG_ACCESS_PROPS } from "../../scenario.types";

let seq = 0;

export const refsEqual = (a: string[], b: string[]) =>
  [...a].sort().join(",") === [...b].sort().join(",");
export const uniqueName = () => `${Date.now()}-${seq++}`;

const equalIgnoreOrders = (arr1: any[], arr2: any[]) => {
  if (arr1.length !== arr2.length) return false;

  const sortedArr1 = [...arr1].sort();
  const sortedArr2 = [...arr2].sort();

  for (let i = 0; i < sortedArr1.length; i++) {
    if (JSON.stringify(sortedArr1[i]) !== JSON.stringify(sortedArr2[i])) {
      return false;
    }
  }

  return true;
};

const credentialsMatch = (
  creds1: Array<{ type: string; value: any }>,
  creds2: Array<{ type: string; value: any }>,
): boolean => {
  // Number of credentials must match
  if (creds1.length !== creds2.length) return false;

  // Group credentials by type
  const groupByType = (creds: typeof creds1) => {
    const groups: Record<string, any[]> = {};
    for (const cred of creds) {
      if (!groups[cred.type]) groups[cred.type] = [];
      groups[cred.type].push(cred.value);
    }
    return groups;
  };

  const groups1 = groupByType(creds1);
  const groups2 = groupByType(creds2);

  // Types must match
  const types1 = Object.keys(groups1).sort();
  const types2 = Object.keys(groups2).sort();
  if (JSON.stringify(types1) !== JSON.stringify(types2)) return false;

  // Check each type
  for (const type of types1) {
    const values1 = groups1[type];
    const values2 = groups2[type];

    if (values1.length !== values2.length) return false;

    if (type === "card") {
      // For cards, all values must have matching counterparts (order irrelevant)
      const sortedValues1 = [...values1].map((v) => JSON.stringify(v)).sort();
      const sortedValues2 = [...values2].map((v) => JSON.stringify(v)).sort();
      if (JSON.stringify(sortedValues1) !== JSON.stringify(sortedValues2)) {
        return false;
      }
    } else if (type === "pin") {
      // For pins, check if each value matches or is '***' (wildcard for hidden pins)
      const sortedValues1 = [...values1].sort();
      const sortedValues2 = [...values2].sort();

      for (let i = 0; i < sortedValues1.length; i++) {
        const v1 = sortedValues1[i];
        const v2 = sortedValues2[i];

        // Match if values are equal OR if either is '***' (provider hiding the pin)
        if (v1 !== v2 && v1 !== "****" && v2 !== "****") {
          return false;
        }
      }
    } else {
      // For other types (e.g., fingerprint), use exact matching
      const sortedValues1 = [...values1].map((v) => JSON.stringify(v)).sort();
      const sortedValues2 = [...values2].map((v) => JSON.stringify(v)).sort();
      if (JSON.stringify(sortedValues1) !== JSON.stringify(sortedValues2)) {
        return false;
      }
    }
  }

  return true;
};

const isSameDate = (date1: string | null, date2: string | null): boolean => {
  if (date1 === null && date2 === null) return true;
  if (date1 === null || date2 === null) return false;

  const d1 = new Date(date1);
  const d2 = new Date(date2);

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const isTodayOrEarlier = (date: string): boolean => {
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d <= today;
};

// Compared by day, so an end written as "now + 5 years" still counts
// when checked moments later
const isAtLeastFiveYearsFromNow = (date: string): boolean => {
  const d = new Date(date);
  const fiveYearsFromNow = new Date();
  fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
  fiveYearsFromNow.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d >= fiveYearsFromNow;
};

// Fields already warned about per scenario, so each stand-in is raised once
const notedStandIns = new WeakMap<(msg: string) => void, Set<string>>();

// A null validFrom / validTo from Aware means open-ended. Providers that
// cannot store "no date" may report a stand-in (a start of today or earlier,
// an end at least 5 years away); that is accepted, but each one is raised via
// `warn` when the person matches, since describe should report null.
export const personsMatch = ({
  provider,
  aware,
  warn,
}: {
  provider: ExternalPersonProps;
  aware: ExternalPersonProps;
  warn?: (msg: string) => void;
}) => {
  const standIns: [field: string, value: string][] = [];

  // Basic fields must match exactly
  if (provider.firstName !== aware.firstName) return false;
  if (provider.lastName !== aware.lastName) return false;
  if (!credentialsMatch(provider.credentials, aware.credentials)) return false;

  // validFrom logic
  if (aware.validFrom !== null) {
    // If aware has validFrom set, provider must have the same date (ignore time)
    if (!isSameDate(aware.validFrom, provider.validFrom)) return false;
  } else {
    // If aware validFrom is null, provider should be null or today or earlier
    if (provider.validFrom !== null) {
      if (!isTodayOrEarlier(provider.validFrom)) return false;
      standIns.push(["validFrom", provider.validFrom]);
    }
  }

  // validTo logic
  if (aware.validTo !== null) {
    // If aware has validTo set, provider must have the same date (ignore time)
    if (!isSameDate(aware.validTo, provider.validTo)) return false;
  } else {
    // If aware validTo is null, provider should be null or at least 5 years from now
    if (provider.validTo !== null) {
      if (!isAtLeastFiveYearsFromNow(provider.validTo)) return false;
      standIns.push(["validTo", provider.validTo]);
    }
  }

  if (warn) {
    const noted = notedStandIns.get(warn) ?? new Set<string>();
    notedStandIns.set(warn, noted);
    for (const [field, value] of standIns) {
      if (noted.has(field)) continue;
      noted.add(field);
      warn(
        `Aware sent no ${field} but the provider reports ${value} — accepted as open-ended, but describe should report null for it`,
      );
    }
  }
  return true;
};

const hhmmssToSeconds = (t: number): number => {
  const ss = t % 100;
  const mm = Math.floor(t / 100) % 100;
  const hh = Math.floor(t / 10000);
  return hh * 3600 + mm * 60 + ss;
};

export const schedulesMatch = (
  s1: ExternalScheduleProps,
  s2: ExternalScheduleProps,
) => {
  if (s1.displayName !== s2.displayName) return false;

  const i1 = s1.include;
  const i2 = s2.include;

  if (i1.repeat !== i2.repeat) return false;
  if (i1.startDate !== i2.startDate) return false;
  if (i1.endDate !== i2.endDate) return false;

  if (i1.timeIntervals.length !== i2.timeIntervals.length) return false;

  const sort = (intervals: typeof i1.timeIntervals) =>
    [...intervals].sort((a, b) =>
      a.weekDay !== b.weekDay
        ? a.weekDay.localeCompare(b.weekDay)
        : a.from - b.from,
    );

  const sorted1 = sort(i1.timeIntervals);
  const sorted2 = sort(i2.timeIntervals);

  return sorted1.every(
    (a, idx) =>
      a.weekDay === sorted2[idx].weekDay &&
      a.from === sorted2[idx].from &&
      Math.abs(hhmmssToSeconds(a.to) - hhmmssToSeconds(sorted2[idx].to)) <= 1,
  );
};

export const zonesMatch = (z1: ExternalZoneProps, z2: ExternalZoneProps) => {
  return (
    z1.displayName === z2.displayName &&
    equalIgnoreOrders(z1.devices, z2.devices)
  );
};

export const rulesMatch = (
  r1: ExternalAccessRuleProps,
  r2: ExternalAccessRuleProps,
) => {
  return (
    r1.displayName === r2.displayName &&
    equalIgnoreOrders(r1.appliedTo, r2.appliedTo) &&
    equalIgnoreOrders(r1.permissions, r2.permissions) &&
    equalIgnoreOrders(r1.groupPermissions, r2.groupPermissions)
  );
};

export const newPerson = (
  credentials: ExternalPersonProps["credentials"],
): ExternalPersonProps => ({
  firstName: uniqueName(),
  lastName: uniqueName(),
  validFrom: null,
  validTo: null,
  accessSuspended: false,
  credentials,
});

export const newSchedule = (): ExternalScheduleProps => ({
  displayName: uniqueName(),
  include: {
    repeat: "weekly",
    startDate: null,
    endDate: null,
    timeIntervals: [
      {
        from: 80000,
        to: 170000,
        weekDay: "mon",
      },
    ],
  },
});

export const newZone = (): ExternalZoneProps => ({
  displayName: uniqueName(),
  devices: [],
});

export const newRule = (): ExternalAccessRuleProps => ({
  displayName: uniqueName(),
  appliedTo: [],
  permissions: [],
  groupPermissions: [],
});

// Built-in Aware schedules, shaped the way the server sends them to agents
export const newFixedSchedule = (flag: FlagType): ExternalScheduleProps =>
  flag === "always"
    ? {
        displayName: "All Day / All Week Days",
        flag: "always",
        include: {
          repeat: "weekly",
          startDate: null,
          endDate: null,
          timeIntervals: (
            ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const
          ).map((weekDay) => ({ weekDay, from: 0, to: 235959 })),
        },
      }
    : {
        displayName: "No Schedule",
        flag: "never",
        include: {
          repeat: null,
          startDate: null,
          endDate: null,
          timeIntervals: [],
        },
      };

// A provider supports custom schedules when it declares the 'schedule'
// access object; otherwise it only understands the always/never flags
export const supportsCustomSchedules = (ctx: ScenarioContext) =>
  (
    ctx.registerPayload.accessControlProviders?.[ctx.provider]?.accessObjects ??
    []
  ).includes("schedule");

// ----------------------------------------------------------------
// createTestSchedule — creates a schedule to be used as a dependency
//   (e.g. by an access rule) and registers its cleanup.
//   - custom-schedule providers: a new weekly schedule; validate +
//     apply + describe/compare (TAG_ACCESS_PROPS). `flag` is ignored.
//   - fixed-only providers: the built-in `flag` schedule; validate +
//     apply + re-merge keeps refs. Never described, since such
//     providers don't support describing schedules.
// ----------------------------------------------------------------

export const createTestSchedule = async (
  ctx: ScenarioContext,
  flag: FlagType,
) => {
  const custom = supportsCustomSchedules(ctx);
  const awareId = v4();
  const props = custom ? newSchedule() : newFixedSchedule(flag);
  const label = custom ? "custom schedule" : `'${flag}' schedule`;

  const mergeRequest = (refs: string[]) => ({
    provider: ctx.provider,
    refMap: { schedule: { [awareId]: refs } },
    devices: {},
    mutations: [
      {
        kind: "merge" as const,
        objectId: awareId,
        objectKind: "schedule" as const,
        original: props,
        props,
      },
    ],
  });

  const validateResult = await ctx.getReply({
    kind: "validate-change",
    ...mergeRequest([]),
  });
  if (validateResult.issues.length > 0) {
    throw new Error(
      `createTestSchedule (${label}): expected 0 issues, got ${validateResult.issues.length}: ${JSON.stringify(validateResult.issues)}`,
    );
  }

  const applyResult = await ctx.getReply({
    kind: "apply-change",
    ...mergeRequest([]),
  });
  const refs = applyResult.refs.schedule?.[awareId] ?? [];
  if (refs.length < 1) {
    throw new Error(
      `createTestSchedule (${label}): expected at least 1 reference, got ${refs.length}`,
    );
  }
  ctx.log(`Created ${label} with ref(s) [${refs}]`);

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

  if (!custom) {
    const reMerge = await ctx.getReply({
      kind: "apply-change",
      ...mergeRequest(refs),
    });
    // Empty refs on an update means the agent updated in-place — that is success
    const refs2 = reMerge.refs.schedule?.[awareId] ?? [];
    if (refs2.length > 0 && !refsEqual(refs, refs2)) {
      throw new Error(
        `createTestSchedule (${label}): re-merge changed refs: original [${refs}], got [${refs2}]`,
      );
    }
    ctx.log(`Re-merged ${label}, refs unchanged`);
  } else if (ctx.tags.includes(TAG_ACCESS_PROPS)) {
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

  return { awareId, refs, props, custom };
};

// ----------------------------------------------------------------
// Helpers shared by scenarios that reproduce the exact shapes the
// Aware server sends (see aware-api access/sync and command-handlers)
// ----------------------------------------------------------------

export type RefMap = Record<string, Record<string, string[]>>;
export type Devices = Record<string, Record<string, unknown>>;

export const accessObjectsOf = (ctx: ScenarioContext) =>
  ctx.registerPayload.accessControlProviders?.[ctx.provider]?.accessObjects ??
  [];

// Aware sends validFrom / validTo as date-only strings (YYYY-MM-DD)
export const toDateOnly = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const daysFromToday = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateOnly(d);
};

// A provider value represents the date-only `expected` when it starts with
// it ("2027-03-01", "2027-03-01T00:00:00Z") or falls on it in local time
export const representsDate = (value: string | null, expected: string) =>
  value !== null &&
  (value.slice(0, 10) === expected || toDateOnly(new Date(value)) === expected);

// The fields of Aware's PersonDto that are not part of ExternalPersonProps.
// update-person sends whatever the user edited plus lastModifiedOn; a resync
// sends the whole DTO (minus id and accessRules) as props.
export const personDtoExtras = (provider: string) => ({
  position: "Deckhand",
  avatarId: null,
  staffMember: true,
  createdOn: new Date().toISOString(),
  lastModifiedOn: new Date().toISOString(),
  refs: { [`${provider}-other`]: ["other-provider-ref"] },
  version: 1,
  archived: false,
  customFields: { cabin: "A12" },
  type: null,
  agreements: [],
});

export const getReaders = async (ctx: ScenarioContext, max: number) => {
  const devicesResponse = await ctx.getReply({
    kind: "get-available-devices",
    provider: ctx.provider,
  });
  return devicesResponse.devices
    .filter((d) => d.type === "reader")
    .slice(0, max);
};

export const describeObject = async (
  ctx: ScenarioContext,
  objectKind: "person" | "schedule" | "accessRule",
  refs: string[],
) => {
  const r = await ctx.getReply({
    kind: "describe-object",
    provider: ctx.provider,
    objectKind,
    objectAssignedRef: refs.join(","),
  });
  if (r.object === null) {
    throw new Error(
      `describe-object returned null for ${objectKind} with ref(s) [${refs}]`,
    );
  }
  return r.object.data;
};

// ----------------------------------------------------------------
// createTestPerson — apply + register cleanup that deletes the
//   person using whatever props are current at cleanup time
// ----------------------------------------------------------------

export const createTestPerson = async (
  ctx: ScenarioContext,
  props: ExternalPersonProps,
) => {
  const awareId = v4();
  const state = { props, refs: [] as string[] };

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
        original: props,
        props,
      },
    ],
  });
  state.refs = r.refs.person?.[awareId] ?? [];
  if (state.refs.length < 1) {
    throw new Error(
      `createTestPerson: expected ≥1 ref, got ${state.refs.length}`,
    );
  }
  trackPersonCleanup(ctx, awareId, state);

  return { awareId, state };
};

export const trackPersonCleanup = (
  ctx: ScenarioContext,
  awareId: string,
  state: { props: ExternalPersonProps; refs: string[] },
) =>
  ctx.registerCleanup(`person ${awareId}`, async () => {
    await ctx.getReply({
      kind: "apply-change",
      provider: ctx.provider,
      refMap: { person: { [awareId]: state.refs } },
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

// ----------------------------------------------------------------
// createTestRule — creates one schedule per reader ('always', then
//   'never' for fixed-schedule providers) and an access rule applied
//   to `people`, granting reader[i] on schedule[i]. Registers cleanup
//   that deletes the rule using the state current at cleanup time.
//   Returns everything needed to send further merges for the rule.
// ----------------------------------------------------------------

export const createTestRule = async (
  ctx: ScenarioContext,
  people: { awareId: string; state: { refs: string[] } }[],
  readers: Awaited<ReturnType<typeof getReaders>>,
) => {
  const flags = ["always", "never"] as const;
  const grants = [];
  for (const [i, reader] of readers.entries()) {
    const schedule = await createTestSchedule(ctx, flags[i % 2]);
    grants.push({ readerId: v4(), reader, schedule });
  }

  const ruleId = v4();
  const props: ExternalAccessRuleProps = {
    ...newRule(),
    appliedTo: people.map((p) => p.awareId),
    permissions: grants.map((g) => ({
      deviceId: g.readerId,
      scheduleId: g.schedule.awareId,
    })),
    groupPermissions: [],
  };
  // refs of everything the rule can point at
  const dependencyRefs: RefMap = {
    person: Object.fromEntries(people.map((p) => [p.awareId, p.state.refs])),
    schedule: Object.fromEntries(
      grants.map((g) => [g.schedule.awareId, g.schedule.refs]),
    ),
    device: Object.fromEntries(
      grants.map((g) => [g.readerId, [g.reader.foreignRef]]),
    ),
  };
  const devices: Devices = Object.fromEntries(
    grants.map((g) => [
      g.readerId,
      { ...g.reader.providerMetadata } as Record<string, unknown>,
    ]),
  );

  const r = await ctx.getReply({
    kind: "apply-change",
    provider: ctx.provider,
    refMap: { ...dependencyRefs, accessRule: { [ruleId]: [] } },
    devices,
    mutations: [
      {
        kind: "merge",
        objectId: ruleId,
        objectKind: "accessRule",
        original: props,
        props,
      },
    ],
  });
  const state = { props, refs: r.refs.accessRule?.[ruleId] ?? [] };
  if (state.refs.length < 1) {
    throw new Error(
      `createTestRule: expected ≥1 ref, got ${state.refs.length}`,
    );
  }

  ctx.registerCleanup(`accessRule ${ruleId}`, async () => {
    await ctx.getReply({
      kind: "apply-change",
      provider: ctx.provider,
      refMap: { ...dependencyRefs, accessRule: { [ruleId]: state.refs } },
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

  // The third party returns its own local refs, not Aware IDs — this maps
  // rule props to what describe-object should return
  const ref = (kind: string, id: string) =>
    (dependencyRefs[kind][id] ?? []).join(",");
  const toProviderRefs = (p: ExternalAccessRuleProps) => ({
    ...p,
    appliedTo: p.appliedTo.map((id) => ref("person", id)),
    permissions: p.permissions.map((perm) => ({
      deviceId: ref("device", perm.deviceId),
      scheduleId: ref("schedule", perm.scheduleId),
    })),
  });

  return { ruleId, state, dependencyRefs, devices, grants, toProviderRefs };
};

// Verifies (via describe-object) that the provider holds the expected rule
export const assertRuleDescribed = async (
  ctx: ScenarioContext,
  label: string,
  rule: Pick<
    Awaited<ReturnType<typeof createTestRule>>,
    "state" | "toProviderRefs"
  >,
) => {
  const got = (await describeObject(
    ctx,
    "accessRule",
    rule.state.refs,
  )) as ExternalAccessRuleProps;
  const expected = rule.toProviderRefs(rule.state.props);
  if (!rulesMatch(got, expected)) {
    throw new Error(
      `${label}: access rule mismatch. Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(got)}`,
    );
  }
};

// ----------------------------------------------------------------
// updateTestPerson — validate + apply a person merge with the given
//   props (sent as-is, so they may carry fields outside the schema)
//   and `original` = the current state. The person must keep its refs
//   (empty refs mean updated in place). `apply` merges into the state.
// ----------------------------------------------------------------

export const updateTestPerson = async (
  ctx: ScenarioContext,
  label: string,
  person: {
    awareId: string;
    state: { props: ExternalPersonProps; refs: string[] };
  },
  props: Record<string, unknown>,
  apply: Partial<ExternalPersonProps>,
) => {
  const request = {
    provider: ctx.provider,
    refMap: { person: { [person.awareId]: person.state.refs } },
    devices: {},
    mutations: [
      {
        kind: "merge",
        objectId: person.awareId,
        objectKind: "person",
        original: person.state.props,
        props,
      } as AccessMutation,
    ],
  };

  const v = await ctx.getReply({ kind: "validate-change", ...request });
  if (v.issues.length > 0) {
    throw new Error(
      `${label}: expected 0 issues, got ${v.issues.length}: ${JSON.stringify(v.issues)}`,
    );
  }
  const r = await ctx.getReply({ kind: "apply-change", ...request });
  const newRefs = r.refs.person?.[person.awareId] ?? [];
  if (newRefs.length > 0 && !refsEqual(newRefs, person.state.refs)) {
    throw new Error(
      `${label}: refs changed from [${person.state.refs}] to [${newRefs}]`,
    );
  }
  person.state.props = { ...person.state.props, ...apply };
};
