import { z } from 'zod';

export const NVR_ANALYTICS_SERVER = 'nvr-analytics-server';

export const sAnalyticsServerSpecs = z.object({});
export type AnalyticsServerSpecs = z.infer<typeof sAnalyticsServerSpecs>;

export const sAnalyticsServerStateDto = z.object({
  connected: z.boolean(),
});

export type AnalyticsServerStateDto = z.infer<typeof sAnalyticsServerStateDto>;
