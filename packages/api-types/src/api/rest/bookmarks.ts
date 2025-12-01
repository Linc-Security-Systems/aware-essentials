import { sBookmarkProps } from '../../objects/bookmark';
import { z } from 'zod';

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

export const sBookmarkSearchCriteria = z.object({
  deviceId: z.array(z.string()),
  createdBy: z.array(z.string()),
  timeFrom: z.number().min(0),
  timeTo: z.number().min(0),
});

export type CreateBookmarkRq = z.infer<typeof sCreateBookmarkRq>;
export type UpdateBookmarkRq = z.infer<typeof sUpdateBookmarkRq>;
export type UpdateBookmarkBody = z.infer<typeof sUpdateBookmarkBody>;
export type DeleteBookmarkRq = z.infer<typeof sDeleteBookmarkRq>;
export type BookmarkSearchCriteria = z.infer<typeof sBookmarkSearchCriteria>;
