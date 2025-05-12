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
  createdOn: z.string(),
  lastModifiedOn: z.string(),
  createdBy: z.string().nullable(),
  items: z.array(sMacroItemDto),
});

export const sAddMacroRequest = sMacroDto.omit({
  id: true,
  createdOn: true,
  lastModifiedOn: true,
  createdBy: true,
});

export const sUpdateMacroRequest = sAddMacroRequest.partial();

export type MacroItemDto = z.infer<typeof sMacroItemDto>;
export type MacroDto = z.infer<typeof sMacroDto>;
export type AddMacroRequest = z.infer<typeof sAddMacroRequest>;
export type UpdateMacroRequest = z.infer<typeof sUpdateMacroRequest>;
