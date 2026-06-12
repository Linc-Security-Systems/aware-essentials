import {
  ExternalPersonProps,
  ExternalScheduleProps,
  ExternalZoneProps,
  ExternalAccessRuleProps,
} from "@awarevue/api-types";

let seq = 0;
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

const isAtLeastFiveYearsFromNow = (date: string): boolean => {
  const d = new Date(date);
  const fiveYearsFromNow = new Date();
  fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
  return d >= fiveYearsFromNow;
};

export const personsMatch = ({
  provider,
  aware,
}: {
  provider: ExternalPersonProps;
  aware: ExternalPersonProps;
}) => {
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
    if (provider.validFrom !== null && !isTodayOrEarlier(provider.validFrom)) {
      return false;
    }
  }

  // validTo logic
  if (aware.validTo !== null) {
    // If aware has validTo set, provider must have the same date (ignore time)
    if (!isSameDate(aware.validTo, provider.validTo)) return false;
  } else {
    // If aware validTo is null, provider should be null or at least 5 years from now
    if (
      provider.validTo !== null &&
      !isAtLeastFiveYearsFromNow(provider.validTo)
    ) {
      return false;
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
