import { sMacroDto } from '../../objects/macro';
import { z } from 'zod';

export const sAddMacroRequest = sMacroDto.omit({
  id: true,
  createdOn: true,
  lastModifiedOn: true,
  createdBy: true,
});

export const sUpdateMacroRequest = sAddMacroRequest.partial();

export type AddMacroRequest = z.infer<typeof sAddMacroRequest>;
export type UpdateMacroRequest = z.infer<typeof sUpdateMacroRequest>;
