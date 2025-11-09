import { z } from 'zod';

// COMMANDS

export const sDisplayTileItemCamera = z.object({
  type: z.literal('camera'),
  name: z.string().nonempty(),
  username: z.string().nonempty(),
  password: z.string().nonempty(),
  streams: z
    .array(
      z.object({
        streamId: z.string().nonempty(),
        displayName: z.string().nonempty(),
        resolution: z.string().nullable(),
        rtspUrl: z.string().nonempty(),
      }),
    )
    .min(1),
});

export const sDisplayTileItemEmpty = z.object({
  type: z.literal('empty'),
});

export const sDisplayTileItem = z.union([
  sDisplayTileItemCamera,
  sDisplayTileItemEmpty,
]);

export type DisplayTileItemCamera = z.infer<typeof sDisplayTileItemCamera>;
export type DisplayTileItemEmpty = z.infer<typeof sDisplayTileItemEmpty>;

export type DisplayTileItem = z.infer<typeof sDisplayTileItem>;

export const sDisplaySetViewCommand = z.object({
  command: z.literal('display.set-view'),
  params: z.object({
    tiles: z.array(
      z.object({
        items: z.array(sDisplayTileItem),
      }),
    ),
  }),
});

export type DisplaySetViewCommand = z.infer<typeof sDisplaySetViewCommand>;

export const displayCommands = {
  'display.set-view': sDisplaySetViewCommand,
} as const;

export type DisplayCommand = DisplaySetViewCommand;
