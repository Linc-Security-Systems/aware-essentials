import z from 'zod';

export const sPersonTypeDto = z.object({
  id: z
    .string()
    .min(1)
    .max(16)
    .regex(
      /^[a-z-]+$/,
      'Type must contain only lowercase letters (a-z) and hyphens',
    ),
  displayName: z.string().min(1).max(64),
  accessControlUser: z.boolean(),
  systemUser: z.boolean(),
  agreements: z.array(z.string().uuid()),
  securityCheck: z.boolean(),
  inOnCreation: z.boolean(),
  createdOn: z.string().date(),
  lastModifiedOn: z.string().date(),
});

export const sCreatePersonTypeRequest = sPersonTypeDto.omit({
  createdOn: true,
  lastModifiedOn: true,
});

export type PersonTypeDto = z.infer<typeof sPersonTypeDto>;

export type CreatePersonTypeRequest = z.infer<typeof sCreatePersonTypeRequest>;

export const sUpdatePersonTypeRequest = sCreatePersonTypeRequest
  .partial()
  .omit({ id: true });

export type UpdatePersonTypeRequest = z.infer<typeof sUpdatePersonTypeRequest>;
