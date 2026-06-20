import { z } from 'zod';
import { sAiCapability } from './device-relation';

export const NVR_ANALYTICS_SERVER = 'nvr-analytics-server';

export const sAnalyticsServerSpecs = z.object({
  capabilities: z.array(sAiCapability),
});

export type AnalyticsServerSpecs = z.infer<typeof sAnalyticsServerSpecs>;

export const sAnalyticsServerStateDto = z.object({
  connected: z.boolean(),
});

export type AnalyticsServerStateDto = z.infer<typeof sAnalyticsServerStateDto>;
