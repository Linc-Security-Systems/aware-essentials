import { z } from 'zod';
import { sCredentialType } from './credential';

export const sUiOrderHint = z.object({
  kind: z.literal('order'),
  path: z.string(),
  fields: z.array(z.string().nonempty()),
});

export const sUiWidgetHint = z.object({
  kind: z.literal('widget'),
  path: z.string(),
  spanColumns: z.number().optional(),
  password: z.boolean().optional(),
  placeHolder: z.string().optional(),
});

export const sUiHint = z.union([sUiOrderHint, sUiWidgetHint]);

export const sProviderSpecs = z.object({
  title: z
    .string()
    .nonempty()
    .describe('a human-readable name for the provider'),
  configSchema: z
    .unknown()
    .describe(
      'a valid JSON schema that describes provider config data structure',
    ), // We can use AJV to validate the definition of a JSON schema
  configDefault: z
    .record(z.unknown())
    .describe('Default initialized values for configuration'),
  configFormUiHints: z
    .array(sUiHint)
    .optional()
    .describe('UI hints for configuration form visuals'),
});

export const sAccessObjectKind = z.enum([
  'accessRule',
  'schedule',
  'person',
  'device',
  'zone',
]);

export const sTokenSpecs = z.object({
  type: sCredentialType, // etc, those map to a AWARE-standardized set of token types
  regex: z.string().optional(),
  formatDescription: z.string().optional(),
  maxPerPerson: z.number().optional(),
});

export const sAccessControlCapabilityReport = z.object({
  tokens: z.array(sTokenSpecs),
  accessObjects: z.array(sAccessObjectKind),
  oneSchedulePerDoor: z.boolean(),
});

export type AccessControlCapabilityReport = z.infer<
  typeof sAccessControlCapabilityReport
>;
export type AccessTokenSpecs = z.infer<typeof sTokenSpecs>;
export type AccessObjectKind = z.infer<typeof sAccessObjectKind>;
export type UiHint = z.infer<typeof sUiHint>;
export type UiOrderHint = z.infer<typeof sUiOrderHint>;
export type UiWidgetHint = z.infer<typeof sUiWidgetHint>;
export type ProviderSpecs = z.infer<typeof sProviderSpecs>;
