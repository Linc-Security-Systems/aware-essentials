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

export type CustomFieldDto = z.infer<typeof sCustomFieldDto>;
