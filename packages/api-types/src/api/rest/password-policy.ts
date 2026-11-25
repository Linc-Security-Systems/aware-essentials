import { z } from 'zod';
import {
  USER_PASSWORD_MAX_LENGTH,
  USER_PASSWORD_MIN_LENGTH,
} from '../../objects/user';
import { PasswordPolicy } from './app';

const sCharacterCount = z.number().int().min(0).max(USER_PASSWORD_MAX_LENGTH);

export const sUpdatePasswordPolicyRequest = z
  .object({
    minLength: z
      .number()
      .int()
      .min(USER_PASSWORD_MIN_LENGTH)
      .max(USER_PASSWORD_MAX_LENGTH),
    minSpecialChars: sCharacterCount,
    /** At least this many uppercase and this many lowercase letters. */
    minDifferentCase: sCharacterCount,
    minDigits: sCharacterCount,
  })
  .refine(
    (policy) =>
      policy.minSpecialChars + policy.minDigits + 2 * policy.minDifferentCase <=
      USER_PASSWORD_MAX_LENGTH,
    {
      message: `The required characters do not fit in a password of ${USER_PASSWORD_MAX_LENGTH} characters, the longest allowed`,
      path: ['minSpecialChars'],
    },
  );

export type UpdatePasswordPolicyRequest = z.infer<
  typeof sUpdatePasswordPolicyRequest
>;

/** The policy as a sentence, shown to users whose password does not meet it. */
export const passwordPolicyText = (policy: PasswordPolicy): string => {
  const requirements = [`at least ${policy.minLength} characters`];
  if (policy.minSpecialChars > 0) {
    requirements.push(
      `at least ${policy.minSpecialChars} special character(s)`,
    );
  }
  if (policy.minDifferentCase > 0) {
    requirements.push(
      `at least ${policy.minDifferentCase} uppercase and ${policy.minDifferentCase} lowercase letter(s)`,
    );
  }
  if (policy.minDigits > 0) {
    requirements.push(`at least ${policy.minDigits} digit(s)`);
  }
  return `Password must contain ${requirements.join(', ')}.`;
};

/** Checks passwords against the policy; the same check runs on the server and in the UI. */
export const passwordPolicyValidator =
  (policy: PasswordPolicy) =>
  (password: string): boolean => {
    if (password.length < policy.minLength) {
      return false;
    }
    const count = (pattern: RegExp) => password.match(pattern)?.length ?? 0;
    return (
      count(/[^a-zA-Z0-9\s]/gu) >= policy.minSpecialChars &&
      Math.min(count(/[A-Z]/g), count(/[a-z]/g)) >= policy.minDifferentCase &&
      count(/[0-9]/g) >= policy.minDigits
    );
  };
