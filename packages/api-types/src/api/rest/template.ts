import { sTemplateTypeEnum, TemplateDto } from '../../objects/template';
import { z } from 'zod';

export const sNewTemplateRequest = z.object({
  name: z.string().min(1).max(64),
  type: sTemplateTypeEnum,
  templateHtmlId: z.string().uuid(),
});

export const sUpdateTemplateRequest = z.object({
  name: z.string().min(1).max(64).optional(),
  type: sTemplateTypeEnum.optional(),
  templateHtmlId: z.string().uuid().optional(),
});

export type NewTemplateRequest = z.infer<typeof sNewTemplateRequest>;
export type UpdateTemplateRequest = z.infer<typeof sUpdateTemplateRequest>;

export type TemplateRequestQueryParams = {
  type: TemplateDto['type'];
};
