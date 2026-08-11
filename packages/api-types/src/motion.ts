// {
//     "streamId": "60d0d4ba-a90b-4a00-9ceb-b05838f81651-3632e728-5481-4f2f-8bb8-0e78dfff1a22",
//     "from": 1786355101000,
//     "to": 1786527901000,
//     "bucketMs": 34560,
//     "baseline": {
//         "floor": 0.93,
//         "ceiling": 3.04
//     },
//     "samples": [
//         {
//             "t": 1786447284480,
//             "avg": 0.37579882,
//             "max": 2.23,
//             "rms": 0.27923077,
//             "n": 169
//         },
//         {
//             "t": 1786447319040,
//             "avg": 0.8835294,
//             "max": 1.84,
//             "rms": 0.4920588,
//             "n": 34
//         }
//     ]
// }

import { z } from 'zod';

export const sStreamMotionStatsSample = z.object({
  t: z.number().int().nonnegative(),
  avg: z.number(),
  max: z.number(),
  rms: z.number(),
  n: z.number().int().nonnegative(),
});

export const sStreamMotionStats = z.object({
  streamId: z.string(),
  from: z.number().int().nonnegative(),
  to: z.number().int().nonnegative(),
  bucketMs: z.number().int().nonnegative(),
  baseline: z.object({
    floor: z.number(),
    ceiling: z.number(),
  }),
  samples: z.array(sStreamMotionStatsSample),
});

export type StreamMotionStatsSample = z.infer<typeof sStreamMotionStatsSample>;

export type StreamMotionStats = z.infer<typeof sStreamMotionStats>;
