import { z } from 'zod';

// EVENTS

export const sPanicButtonPressedEvent = z.object({
  kind: z.literal('panic-button-pressed'),
});

export const panicButtonEventSchemaByKind = {
  'panic-button-pressed': sPanicButtonPressedEvent,
} as const;

export type PanicButtonPressedEvent = z.infer<typeof sPanicButtonPressedEvent>;

export type PanicButtonEvent = PanicButtonPressedEvent;
