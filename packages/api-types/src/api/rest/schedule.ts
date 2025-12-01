import {
  sFlagType,
  sScheduleDetailsRequest,
  sScheduleProps,
} from '../../objects/schedule';
import { z } from 'zod';

export const sCreateScheduleRequest = sScheduleProps;

export type CreateScheduleRequest = z.infer<typeof sCreateScheduleRequest>;

export const sUpdateScheduleRequest = z.object({
  displayName: z.string().optional(),
  flag: sFlagType.nullable().optional(),
  include: sScheduleDetailsRequest.nullable().optional(),
  exclude: sScheduleDetailsRequest.nullable().optional(),
});

export type UpdateScheduleRequest = { id: string } & z.infer<
  typeof sUpdateScheduleRequest
>;
