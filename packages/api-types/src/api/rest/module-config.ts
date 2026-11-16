import { JSONSchema4 } from 'json-schema';
import z from 'zod';
import { UiHint } from '../../objects';

export interface SaveProviderConfigRq {
  provider: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export const sConfigIssue = z.object({
  paths: z.array(z.string()),
  message: z.string(),
  provider: z.string(),
});

export type ConfigIssue = z.infer<typeof sConfigIssue>;

export interface ModuleConfigSpecs {
  provider: string;
  title: string;
  schema: JSONSchema4;
  default: Record<string, unknown>;
  uiHints?: UiHint[];
}

export const sModuleConfig = z
  .object({ app: z.object({ modules: z.array(z.string()) }) })
  .catchall(z.record(z.string(), z.unknown()));
