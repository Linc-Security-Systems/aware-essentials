import { z } from 'zod';
import { sDeviceParam, sMacroId, sNotificationSeverity } from '../primitives';

// COMMANDS

export const sRunMacroCommand = z.object({
  command: z.literal('server.run-macro'),
  params: z.object({
    macroId: sMacroId,
  }),
});

export const sNotify = z.object({
  command: z.literal('server.notify'),
  params: z.object({
    source: sDeviceParam,
    message: z.string().nonempty(),
    severity: sNotificationSeverity,
    metadata: z.record(z.unknown()),
    notificationRef: z.string().nonempty().nullable(),
    recipientId: z.string().nonempty().nullable(),
  }),
});

export type RunMacro = z.infer<typeof sRunMacroCommand>;

export type Notify = z.infer<typeof sNotify>;

export const serverCommands = {
  'server.run-macro': sRunMacroCommand,
  'server.notify': sNotify,
} as const;

export type ServerCommand = RunMacro | Notify;
