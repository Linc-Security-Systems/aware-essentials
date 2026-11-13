import { z } from 'zod';
import { sLayoutLocationProps } from '../../objects/layout-location';

export const sAddLayoutLocationRequest = sLayoutLocationProps.extend({
  order: z.number().int().min(0).optional(),
});

export type AddLayoutLocationRequest = { layoutId: string } & z.infer<
  typeof sAddLayoutLocationRequest
>;

export const sUpdateLayoutLocationRequest = sLayoutLocationProps
  .extend({
    order: z.number().int().min(0),
  })
  .partial();

export type UpdateLayoutLocationRequest = {
  layoutId: string;
  id: string;
} & z.infer<typeof sUpdateLayoutLocationRequest>;
