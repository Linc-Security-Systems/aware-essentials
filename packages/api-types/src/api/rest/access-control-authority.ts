import { z } from 'zod';

// Number of local objects that currently have a reference in the provider
export const sAccessProviderObjectCounts = z.object({
  person: z.number().int(),
  accessRule: z.number().int(),
  schedule: z.number().int(),
  zone: z.number().int(),
});

export type AccessProviderObjectCounts = z.infer<
  typeof sAccessProviderObjectCounts
>;

// LEGACY(access-control-user-sync): remove once no site has conflicts
// A person whose type is not an access control user, but who still holds
// credentials or access rules. A resync removes them from the provider.
export const sAccessProviderAuditConflict = z.object({
  personId: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  personTypeId: z.string(),
  credentialCount: z.number().int(),
  accessRuleCount: z.number().int(),
});

export type AccessProviderAuditConflict = z.infer<
  typeof sAccessProviderAuditConflict
>;

export const sAccessProviderAuditDto = z.object({
  provider: z.string(),
  // objects held in the provider, according to the reference table
  held: sAccessProviderObjectCounts,
  people: z.object({
    // people whose type is an access control user
    eligible: z.number().int(),
    // eligible people not yet in the provider; a resync adds them
    toAdd: z.number().int(),
    // people in the provider whose type is not an access control user;
    // a resync removes them
    toRemove: z.number().int(),
  }),
  // LEGACY(access-control-user-sync): remove once no site has conflicts
  conflicts: z.array(sAccessProviderAuditConflict),
});

export type AccessProviderAuditDto = z.infer<typeof sAccessProviderAuditDto>;

// Effect of toggling accessControlUser on a person type
export const sPersonTypeSyncImpactDto = z.object({
  personTypeId: z.string(),
  // the value the flag would change to
  accessControlUser: z.boolean(),
  // people that would be added to (enabling) or removed from (disabling)
  // the access control providers; 0 when no provider is connected
  affectedPeople: z.number().int(),
  // people whose credentials and access rules would be removed (disabling only)
  peopleWithAccess: z.number().int(),
  // true when affectedPeople or peopleWithAccess is non-zero; the change then
  // needs the access-authority:sync permission, and a Sync All afterwards
  syncRequired: z.boolean(),
});

export type PersonTypeSyncImpactDto = z.infer<typeof sPersonTypeSyncImpactDto>;
