import z from 'zod';

export const sAddGroupRequest = z.object({
  code: z.string().nullable(),
  displayName: z.string().nonempty(),
  devices: z.array(z.string().nonempty()),
});

export const sUpdateGroupRequest = z.object({
  code: z.string().nullable().optional(),
  displayName: z.string().optional(),
  devices: z.array(z.string().nonempty()).optional(),
});

export const sAddDevicesToGroupRequest = z.object({
  devices: z.array(z.string().nonempty()),
});

export const sRemoveDevicesFromGroupRequest = z.object({
  devices: z.array(z.string().nonempty()),
});

export type AddGroupRequest = z.infer<typeof sAddGroupRequest>;

export type UpdateGroupRequest = { id: string } & z.infer<
  typeof sUpdateGroupRequest
>;

export type AddDevicesToGroupRequest = { id: string } & z.infer<
  typeof sAddDevicesToGroupRequest
>;

export type RemoveDevicesFromGroupRequest = { id: string } & z.infer<
  typeof sRemoveDevicesFromGroupRequest
>;
