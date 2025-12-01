import { z } from 'zod';

export const sMacroItemDto = z.object({
  id: z.string().nullable(),
  stepId: z.string().nonempty(),
  deviceId: z.string().uuid().nonempty(),
  command: z.string().nonempty(),
  params: z.record(z.unknown()),
});

export const sMacroDto = z.object({
  id: z.string().nonempty(),
  displayName: z.string().nonempty(),
  code: z.string().nullable().describe('The code of the macro rule'),
  module: z
    .string()
    .nullable()
    .describe('The module the macro rule belongs to'),
  metadata: z.record(z.unknown()),
  createdOn: z.string(),
  lastModifiedOn: z.string(),
  createdBy: z.string().nullable(),
  items: z.array(sMacroItemDto),
});

export type MacroItemDto = z.infer<typeof sMacroItemDto>;
export type MacroDto = z.infer<typeof sMacroDto>;
