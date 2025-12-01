import { z, ZodTypeAny } from 'zod';

export type PaginatedQueryRequest<TCriteria> = Partial<TCriteria> & {
  q?: string;
  offset?: number;
  limit?: number;
};

export interface PaginatedQueryResponse<T> {
  items: T[];
  total: number;
}

export const sPaginatedQueryRequestOf = <T extends z.AnyZodObject>(
  criteriaSchema: T,
) =>
  z
    .object({
      q: z.string().optional().describe('Not supported yet'),
      offset: z
        .number()
        .optional()
        .describe('Offset of the first item to return'),
      limit: z
        .number()
        .optional()
        .describe('Maximum number of items to return'),
    })
    .merge(criteriaSchema.partial());

export const sPaginatedQueryResponseOf = <T extends ZodTypeAny>(
  itemSchema: T,
) =>
  z.object({
    items: z.array(itemSchema).describe('Array of items matching the query'),
    total: z
      .number()
      .describe(
        'Total number of items matching the query (only one page is shown at a time)',
      ),
  });

// example usage:

// import { sPaginatedQueryRequestOf, sPaginatedQueryResponseOf } from 'aware-api-types';
// import { z } from 'zod';

// const sUserCriteria = z.object({
//     name: z.string().optional(),
//     email: z.string().optional(),
// });

// const sUser = z.object({
//     id: z.string(),
//     name: z.string(),
//     email: z.string(),
// });

// const sPaginatedUserQueryRequest = sPaginatedQueryRequestOf(sUserCriteria);
// const sPaginatedUserQueryResponse = sPaginatedQueryResponseOf(sUser);

// type Request = z.infer<typeof sPaginatedUserQueryRequest>;
// type Response = z.infer<typeof sPaginatedUserQueryResponse>;
