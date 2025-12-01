import { z } from 'zod';

export const DISPLAY = 'display' as const;

// SPECS

export const sDisplaySpecs = z.object({});

export type DisplaySpecs = z.infer<typeof sDisplaySpecs>;

// STATE

export interface DisplayStateDto {
  connected: Record<string, boolean>;
}
