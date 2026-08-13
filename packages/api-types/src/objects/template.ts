import { z } from 'zod';

export const sTemplateTypeEnum = z.enum(['id', 'report']);

export type TemplateTypeEnum = z.infer<typeof sTemplateTypeEnum>;

export const sTemplateDto = z.object({
  id: z.uuid(),
  name: z.string(),
  type: sTemplateTypeEnum,
  templateHtmlId: z.uuid(),
});

export type TemplateDto = z.infer<typeof sTemplateDto>;
