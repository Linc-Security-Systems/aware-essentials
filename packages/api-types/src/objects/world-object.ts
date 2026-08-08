import { z } from 'zod';

export const sWorldObject = z.object({
  id: z.string().describe('The unique identifier of the world object'),
  label: z.string().describe('The label of the world object'),
});

export type WorldObject = z.infer<typeof sWorldObject>;

export const sWorldObjectDto = sWorldObject.extend({
  createdOn: z
    .string()
    .describe('The date and time when the world object was created'),
  lastModifiedOn: z
    .string()
    .describe('The date and time when the world object was last modified'),
});

export type WorldObjectDto = z.infer<typeof sWorldObjectDto>;
