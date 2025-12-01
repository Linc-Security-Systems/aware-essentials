import { z } from 'zod';

export const sBookmarkProps = z.object({
  timestamp: z.number().min(0),
  label: z.string().nonempty(),
  deviceId: z.string().nonempty(),
  metadata: z.record(z.unknown()),
});

export const sBookmarkDto = sBookmarkProps.and(
  z.object({
    id: z.string().nonempty(),
    createdBy: z.string().nonempty(),
    createdOn: z.string().datetime(),
    lastModifiedOn: z.string().datetime(),
  }),
);

export type BookmarkProps = z.infer<typeof sBookmarkProps>;

export type BookmarkDto = z.infer<typeof sBookmarkDto>;
