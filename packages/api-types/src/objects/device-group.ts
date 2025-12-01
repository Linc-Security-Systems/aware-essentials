import { z } from 'zod';

export const sDeviceGroup = z.object({
  id: z.string(),
  code: z.string().nullable(),
  displayName: z.string(),
  createdOn: z.string(),
  lastModifiedOn: z.string(),
  devices: z.array(z.string().nonempty()),
});

export type DeviceGroupDto = z.infer<typeof sDeviceGroup>;
