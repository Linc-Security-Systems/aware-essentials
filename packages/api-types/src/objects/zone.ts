import { z } from 'zod';

export const sZoneProps = z.object({
  displayName: z.string().nonempty(),
  devices: z.array(z.string().nonempty()),
});

export const sZoneDto = z.object({
  id: z.string(),
  displayName: z.string(),
  createdOn: z.string(),
  lastModifiedOn: z.string(),
  devices: z.array(z.string()),
  isGlobal: z.boolean(),
  refs: z.record(z.union([z.string(), z.array(z.string())])),
  version: z.number(),
});

export type ZoneDto = z.infer<typeof sZoneDto>;

export type ZoneProps = z.infer<typeof sZoneProps>;
