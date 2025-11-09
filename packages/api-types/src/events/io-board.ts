import { z } from 'zod';

// EVENTS

export const sIoBoardInputChangedEvent = z.object({
  kind: z.literal('io-board-input-changed'),
  inputName: z.string().nonempty(),
  value: z.boolean(),
});

export const ioBoardEventSchemaByKind = {
  'io-board-input-changed': sIoBoardInputChangedEvent,
} as const;

export type IoBoardInputChangedEvent = z.infer<
  typeof sIoBoardInputChangedEvent
>;

export type IoBoardEvent = IoBoardInputChangedEvent;
