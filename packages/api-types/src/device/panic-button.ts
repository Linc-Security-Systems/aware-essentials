import { z } from 'zod';

export const PANIC_BUTTON = 'panic-button' as const;

// SPECS

export const sPanicButtonSpecs = z.object({});

export type PanicButtonSpecs = z.infer<typeof sPanicButtonSpecs>;

// COMMANDS

// STATE

export interface PanicButtonStateDto {
  isPressed: boolean;
  connected: boolean;
}

// EVENTS

export const sPanicButtonPressedEvent = z.object({
  kind: z.literal('panic-button-pressed'),
});

export const panicButtonEventSchemaByKind = {
  'panic-button-pressed': sPanicButtonPressedEvent,
} as const;

export type PanicButtonPressedEvent = z.infer<typeof sPanicButtonPressedEvent>;

export type PanicButtonEvent = PanicButtonPressedEvent;
