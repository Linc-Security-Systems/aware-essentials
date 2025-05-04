import { z } from 'zod';

export const CustomFieldTypeEnum = z.enum([
  'string',
  'number',
  'boolean',
  'date',
]);

export const CustomFieldExtendsTypeEnum = z.enum(['person']);

export const sCustomFieldDto = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(64),
  type: CustomFieldTypeEnum,
  extendsType: CustomFieldExtendsTypeEnum,
});

export const sAddCustomFieldRequest = sCustomFieldDto.omit({ id: true });
export const sUpdateCustomFieldRequest = sAddCustomFieldRequest.partial();

export type CustomFieldDto = z.infer<typeof sCustomFieldDto>;
export type AddCustomFieldRequest = z.infer<typeof sAddCustomFieldRequest>;
export type UpdateCustomFieldRequest = z.infer<
  typeof sUpdateCustomFieldRequest
>;

export type CustomFieldRequestQueryParams = {
  extendsType: CustomFieldDto['extendsType'];
};
