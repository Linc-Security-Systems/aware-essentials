import {
  CreatePersonRequest,
  CreateAccessRuleRequest,
  CreateScheduleRequest,
  CreateZoneRequest,
} from "@awarevue/api-types";

let seq = 0;
export const uniqueName = () => `${Date.now()}-${seq++}`;

export const newPerson = (): CreatePersonRequest => ({
  firstName: uniqueName(),
  lastName: uniqueName(),
  position: null,
  type: "staff",
  validFrom: null,
  validTo: null,
  accessSuspended: false,
  accessRules: [],
  credentials: [],
  avatarId: null,
  staffMember: false,
  customFields: {},
});

export const newSchedule = (): CreateScheduleRequest => ({
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
  exclude: null,
  flag: null,
});

export const newZone = (): CreateZoneRequest => ({
  displayName: uniqueName(),
  devices: [],
});

export const newRule = (): CreateAccessRuleRequest => ({
  displayName: uniqueName(),
  appliedTo: [],
  permissions: [],
  groupPermissions: [],
});
