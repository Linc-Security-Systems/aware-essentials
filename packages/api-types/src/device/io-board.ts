import { z } from 'zod';

export const IO_BOARD = 'io-board' as const;

// SPECS

export const sIoBoardSpecs = z.object({
  inputs: z.array(z.string().nonempty()),
  outputs: z.array(z.string().nonempty()),
});

export type IoBoardSpecs = z.infer<typeof sIoBoardSpecs>;

// COMMANDS

export const sIoBoardSetOutputCommand = z.object({
  command: z.literal('io-board.set-output'),
  params: z.object({
    output: z.string().nonempty(),
    value: z.boolean(),
  }),
});

export const ioBoardCommands = {
  'io-board.set-output': sIoBoardSetOutputCommand,
} as const;

export type IoBoardSetOutputCommand = z.infer<typeof sIoBoardSetOutputCommand>;

export type IoBoardCommand = IoBoardSetOutputCommand;

// STATE

export interface IoBoardStateDto {
  connected: boolean;
  inputValues: Record<string, boolean>;
  outputValues: Record<string, boolean>;
}

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
