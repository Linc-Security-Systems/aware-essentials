import { z } from 'zod';

export const sBookmarkProps = z.object({
  timestamp: z.number().min(0),
  label: z.string().nonempty(),
  deviceId: z.string().nonempty(),
  metadata: z.record(z.unknown()),
});

export const sCreateBookmarkRq = sBookmarkProps;

export const sUpdateBookmarkBody = sBookmarkProps.partial();

export const sUpdateBookmarkRq = z
  .object({
    id: z.string().nonempty(),
  })
  .and(sUpdateBookmarkBody);

export const sDeleteBookmarkRq = z.object({
  id: z.string().nonempty(),
});

export const sBookmarkDto = sBookmarkProps.and(
  z.object({
    id: z.string().nonempty(),
    createdBy: z.string().nonempty(),
    createdOn: z.string().datetime(),
    lastModifiedOn: z.string().datetime(),
  }),
);

export const sBookmarkSearchCriteria = z.object({
  deviceId: z.array(z.string()),
  createdBy: z.array(z.string()),
  timeFrom: z.number().min(0),
  timeTo: z.number().min(0),
});

export type BookmarkProps = z.infer<typeof sBookmarkProps>;
export type CreateBookmarkRq = z.infer<typeof sCreateBookmarkRq>;
export type UpdateBookmarkRq = z.infer<typeof sUpdateBookmarkRq>;
export type UpdateBookmarkBody = z.infer<typeof sUpdateBookmarkBody>;
export type DeleteBookmarkRq = z.infer<typeof sDeleteBookmarkRq>;
export type BookmarkDto = z.infer<typeof sBookmarkDto>;
export type BookmarkSearchCriteria = z.infer<typeof sBookmarkSearchCriteria>;
