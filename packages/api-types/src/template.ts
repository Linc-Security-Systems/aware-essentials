import { z } from 'zod';

export const TemplateTypeEnum = z.enum(['id', 'report']);

export const sNewTemplateRequest = z.object({
  name: z.string().min(1).max(64),
  type: TemplateTypeEnum,
  templateHtmlId: z.string().uuid(),
});

export const sUpdateTemplateRequest = z.object({
  name: z.string().min(1).max(64).optional(),
  type: TemplateTypeEnum.optional(),
  templateHtmlId: z.string().uuid().optional(),
});

export const sTemplateDto = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: TemplateTypeEnum,
  templateHtmlId: z.string().uuid(),
});

export type NewTemplateRequest = z.infer<typeof sNewTemplateRequest>;
export type UpdateTemplateRequest = z.infer<typeof sUpdateTemplateRequest>;
export type TemplateDto = z.infer<typeof sTemplateDto>;
export type TemplateRequestQueryParams = {
  type: TemplateDto['type'];
};
