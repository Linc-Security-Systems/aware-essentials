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

export const personsMatch = (
  p1: ExternalPersonProps,
  p2: ExternalPersonProps,
) => {
  return (
    p1.firstName === p2.firstName &&
    p1.lastName === p2.lastName &&
    p1.validFrom === p2.validFrom &&
    p1.validTo === p2.validTo &&
    equalIgnoreOrders(p1.credentials, p2.credentials)
  );
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
