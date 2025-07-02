import { z } from 'zod';

export const sAutomationRuleCommand = z.object({
  command: z.string().nonempty().describe('The command to be executed'),
  target: z.string().nonempty().describe('The target of the command'),
  params: z
    .record(z.unknown())
    .describe('The parameters of the command depending on what it is'),
});

export const sAutomationRuleBody = z.object({
  onEvent: z
    .string()
    .nonempty()
    .describe('The event that triggers the automation rule'),
  runIf: z
    .string()
    .optional()
    .describe('The condition under which the automation rule should run'),
  commands: z
    .array(sAutomationRuleCommand)
    .describe('The commands to be executed by the automation rule'),
});

export const sAutomationRuleProps = z.object({
  displayName: z
    .string()
    .nonempty()
    .describe('The name of the automation rule'),
  description: z
    .string()
    .optional()
    .describe('A description of the automation rule'),
  code: z.string().nullable().describe('The code of the automation rule'),
  body: sAutomationRuleBody.describe('The body of the automation rule'),
  enabled: z.boolean().describe('Whether the automation rule is enabled'),
});

export const sAddAutomationRuleRequest = sAutomationRuleProps;

export const sUpdateAutomationRule = sAutomationRuleProps.partial().merge(
  z.object({
    id: z.string().describe('The ID of the automation rule'),
  }),
);

export const sAutomationRuleDto = sAutomationRuleProps.merge(
  z.object({
    id: z.string().describe('The ID of the automation rule'),
    exclusivityGroup: z
      .string()
      .nullable()
      .describe(
        'The exclusivity group of the automation rule. Only one matching rule at max will run within one group based on the highest score',
      ),
    module: z
      .string()
      .nullable()
      .describe('The module the automation rule belongs to'),
    code: z.string().nullable().describe('The code of the automation rule'),
    createdOn: z.string().describe('The date the automation rule was created'),
    lastModifiedOn: z
      .string()
      .describe('The date the automation rule was last modified'),
  }),
);

export type AutomationRuleBody = z.infer<typeof sAutomationRuleBody>;

export type AutomationRuleProps = z.infer<typeof sAutomationRuleProps>;

export type AutomationRuleDto = z.infer<typeof sAutomationRuleDto>;

export type AddAutomationRuleRequest = z.infer<
  typeof sAddAutomationRuleRequest
>;

export type UpdateAutomationRuleRequest = z.infer<typeof sUpdateAutomationRule>;
