import { z } from 'zod';
import {
  sDeviceParam,
  sMacroId,
  sNotificationSeverity,
  sSecurityLevelId,
} from '../../primitives';

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
    metadata: z.record(z.string(), z.unknown()),
    notificationRef: z.string().nonempty().nullable(),
    recipientId: z.string().nonempty().nullable(),
  }),
});

export const sSetSecurityLevelCommand = z.object({
  command: z.literal('server.set-security-level'),
  params: z.object({
    // null leaves no security level active
    securityLevelId: sSecurityLevelId.nullable(),
  }),
});

export type RunMacro = z.infer<typeof sRunMacroCommand>;

export type Notify = z.infer<typeof sNotify>;

export type SetSecurityLevel = z.infer<typeof sSetSecurityLevelCommand>;

export const serverCommands = {
  'server.run-macro': sRunMacroCommand,
  'server.notify': sNotify,
  'server.set-security-level': sSetSecurityLevelCommand,
} as const;

export type ServerCommand = RunMacro | Notify | SetSecurityLevel;
