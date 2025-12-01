import { z } from 'zod';

export const PANIC_BUTTON = 'panic-button' as const;

// SPECS

export const sPanicButtonSpecs = z.object({});

export type PanicButtonSpecs = z.infer<typeof sPanicButtonSpecs>;

// STATE

export interface PanicButtonStateDto {
  isPressed: boolean;
  connected: boolean;
}
