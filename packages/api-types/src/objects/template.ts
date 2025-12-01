import { z } from 'zod';

export const sTemplateTypeEnum = z.enum(['id', 'report']);

export type TemplateTypeEnum = z.infer<typeof sTemplateTypeEnum>;

export const sTemplateDto = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: sTemplateTypeEnum,
  templateHtmlId: z.string().uuid(),
});

export type TemplateDto = z.infer<typeof sTemplateDto>;
