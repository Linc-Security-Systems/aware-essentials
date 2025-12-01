import z from 'zod';

export const sWeekDay = z.enum([
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
]);

export type WeekDay = z.infer<typeof sWeekDay>;

export const sRepeatType = z.enum(['daily', 'weekly', 'monthly', 'yearly']);

export type RepeatType = z.infer<typeof sRepeatType>;

export const sFlagType = z.enum(['always', 'never']);

export type FlagType = z.infer<typeof sFlagType>;

export const sTimeIntervalDto = z.object({
  weekDay: sWeekDay,
  from: z.number(),
  to: z.number(),
});

export type TimeIntervalDto = z.infer<typeof sTimeIntervalDto>;

export const sScheduleDetailsDto = z.object({
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  timeIntervals: z.array(sTimeIntervalDto),
  repeat: sRepeatType.nullable(),
});

export type ScheduleDetailsDto = z.infer<typeof sScheduleDetailsDto>;

export const sScheduleDto = z.object({
  id: z.string(),
  displayName: z.string(),
  include: sScheduleDetailsDto.nullable(),
  exclude: sScheduleDetailsDto.nullable(),
  editable: z.boolean(),
  deletable: z.boolean(),
  createdOn: z.string(),
  lastModifiedOn: z.string(),
  refs: z.record(z.union([z.string(), z.array(z.string())])),
  version: z.number(),
  flag: sFlagType.nullable(),
});

export type ScheduleDto = z.infer<typeof sScheduleDto>;

export const sTimeInterval = z.object({
  weekDay: sWeekDay,
  from: z.number().max(240000).min(0),
  to: z.number().max(240000).min(0),
});

export const sScheduleDetailsRequest = z.object({
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  timeIntervals: z.array(sTimeInterval),
  repeat: sRepeatType.nullable(),
});

export type ScheduleDetailsRequest = z.infer<typeof sScheduleDetailsRequest>;

export const sScheduleProps = z.object({
  displayName: z.string().nonempty(),
  flag: sFlagType.nullable(),
  include: sScheduleDetailsRequest.nullable(),
  exclude: sScheduleDetailsRequest.nullable(),
});

export type ScheduleProps = z.infer<typeof sScheduleProps>;
