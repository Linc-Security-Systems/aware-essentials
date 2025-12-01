import { sAccessRuleProps } from '../../objects/access-rule';
import z from 'zod';

export const sCreateAccessRuleRequest = sAccessRuleProps;

export const sUpdateAccessRuleRequest = sCreateAccessRuleRequest.partial();

export const sAddMemberToAccessRuleRequest = z.object({
  personId: z.string().nonempty().describe('Person ID'),
});

export const sRemoveMemberFromAccessRuleRequest = z.object({
  personId: z.string().nonempty().describe('Person ID'),
});

export type CreateAccessRuleRequest = z.infer<typeof sCreateAccessRuleRequest>;

export type UpdateAccessRuleRequest = { id: string } & z.infer<
  typeof sUpdateAccessRuleRequest
>;

export type AddMemberToAccessRuleRequest = { id: string } & z.infer<
  typeof sAddMemberToAccessRuleRequest
>;

export type RemoveMemberFromAccessRuleRequest = { id: string } & z.infer<
  typeof sRemoveMemberFromAccessRuleRequest
>;
