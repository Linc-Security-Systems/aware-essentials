import { CustomFieldDto, sCustomFieldDto } from '../../objects/custom-field';
import { z } from 'zod';

export const sAddCustomFieldRequest = sCustomFieldDto.omit({ id: true });
export const sUpdateCustomFieldRequest = sAddCustomFieldRequest.partial();

export type AddCustomFieldRequest = z.infer<typeof sAddCustomFieldRequest>;
export type UpdateCustomFieldRequest = z.infer<
  typeof sUpdateCustomFieldRequest
>;

export type CustomFieldRequestQueryParams = {
  extendsType: CustomFieldDto['extendsType'];
};
