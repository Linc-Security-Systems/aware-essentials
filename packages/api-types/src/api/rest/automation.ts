import { sAutomationRuleProps } from '../../objects/automation-rule';
import { z } from 'zod';

export const sAddAutomationRuleRequest = sAutomationRuleProps;

export const sUpdateAutomationRule = sAutomationRuleProps.partial().merge(
  z.object({
    id: z.string().describe('The ID of the automation rule'),
  }),
);

export const sAutomationBulkMergeRequest = z.object({
  merge: z
    .array(sAutomationRuleProps)
    .describe('The automation rules to merge by code'),
  removeCodes: z
    .array(z.string())
    .describe('The IDs of the automation rules to delete by code'),
});

export type AddAutomationRuleRequest = z.infer<
  typeof sAddAutomationRuleRequest
>;

export type UpdateAutomationRuleRequest = z.infer<typeof sUpdateAutomationRule>;

export type AutomationBulkMergeRequest = z.infer<
  typeof sAutomationBulkMergeRequest
>;
