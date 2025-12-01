import { z } from 'zod';

export const IO_BOARD = 'io-board' as const;

// SPECS

export const sIoBoardSpecs = z.object({
  inputs: z.array(z.string().nonempty()),
  outputs: z.array(z.string().nonempty()),
});

export type IoBoardSpecs = z.infer<typeof sIoBoardSpecs>;

// STATE

export interface IoBoardStateDto {
  connected: boolean;
  inputValues: Record<string, boolean>;
  outputValues: Record<string, boolean>;
}
