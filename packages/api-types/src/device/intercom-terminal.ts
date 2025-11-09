import { z } from 'zod';

export const INTERCOM_TERMINAL = 'intercom-terminal' as const;

// SPECS

export const sIntercomTerminalSpecs = z.object({
  sipUri: z.string(),
  sipUser: z.string(),
  sipPassword: z.string(),
  sipRealm: z.string(),
  remoteExtension: z.string(),
});

export const sAddIntercomTerminal = z.object({
  name: z.string(),
  foreignRef: z.string(),
  specs: sIntercomTerminalSpecs,
});

export type IntercomTerminalSpecs = z.infer<typeof sIntercomTerminalSpecs>;

export type AddIntercomTerminalRequest = z.infer<typeof sAddIntercomTerminal>;

// STATE

const sCallState = z.enum(['connecting', 'connected', 'ringing', 'terminated']);

export const sIntercomTerminalState = z.object({
  callState: sCallState.nullable(),
  connected: z.boolean(),
  callId: z.string().nullable(),
  peer: z.string().nullable(),
});

export type IntercomTerminalStateDto = z.infer<typeof sIntercomTerminalState>;
