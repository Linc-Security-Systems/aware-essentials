import z from 'zod';

export const sSetTimeZoneRequest = z.object({
  timeZone: z.string().min(1),
});

export type SetTimeZoneRequest = z.infer<typeof sSetTimeZoneRequest>;
