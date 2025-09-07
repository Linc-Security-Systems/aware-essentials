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

// COMMANDS

export interface IntercomConnectCommand {
  command: 'intercom-terminal.connect';
  params: {
    clientId: number;
  };
}

export interface IntercomDisconnectCommand {
  command: 'intercom-terminal.disconnect';
  params: {
    clientId: number;
  };
}

export interface IntercomDialCommand {
  command: 'intercom-terminal.dial';
  params: {
    callId: string;
    offerSdp: string;
  };
}

export interface IntercomCancelCallCommand {
  command: 'intercom-terminal.cancel-call';
  params: {
    callId: string;
  };
}

export interface IntercomAnswerCallCommand {
  command: 'intercom-terminal.answer';
  params: {
    callId: string;
    userAgentId: string;
    answerSdp: string;
  };
}

export interface IntercomHangUpCommand {
  command: 'intercom-terminal.hang-up';
  params: {
    callId: string;
  };
}

export type IntercomTerminalCommand =
  | IntercomConnectCommand
  | IntercomDisconnectCommand
  | IntercomDialCommand
  | IntercomCancelCallCommand
  | IntercomAnswerCallCommand
  | IntercomHangUpCommand;

// STATE

export const sCallState = z.enum([
  'connecting',
  'connected',
  'ringing',
  'terminated',
]);

const sCallDirection = z.enum(['incoming', 'outgoing']);

export const sIntercomTerminalState = z.object({
  callState: sCallState.nullable(),
  connected: z.boolean(),
  callId: z.string().nullable(),
  peer: z.string().nullable(),
});

export type IntercomTerminalStateDto = z.infer<typeof sIntercomTerminalState>;

// export interface IntercomTerminalStateDto {
//   connected: boolean;
//   clientId: number | null;
//   callId: string | null;
//   userAgentId: string | null;
//   offerSdp: string | null;
//   answerSdp: string | null;
//   callState: 'idle' | 'ringing' | 'active';
// }

// EVENTS

export const sCallStateChanged = z.object({
  kind: z.literal('call-state-changed'),
  userId: z.string().optional(),
  callId: z.string().nonempty(),
  state: sCallState,
  peer: z.string().optional(),
  sipAccount: z.string().optional(),
  sipCallId: z.string().optional(),
  direction: sCallDirection,
});

// export const sIntercomCallEvent = z.object({
//   kind: z.literal('intercom-call'),
//   userId: z.string().optional(),
//   personId: z.string().optional(),
//   callId: z.string().nonempty(),
//   offerSdp: z.string().nonempty(),
// });

// export const sIntercomCallCancelledEvent = z.object({
//   kind: z.literal('intercom-call-cancelled'),
//   userId: z.string().optional(),
//   callId: z.string().nonempty(),
// });

// export const sIntercomCallAnsweredEvent = z.object({
//   kind: z.literal('intercom-call-answered'),
//   userId: z.string().optional(),
//   userAgentId: z.string().nonempty(),
//   callId: z.string().nonempty(),
//   answerSdp: z.string().nonempty(),
// });

// export const sIntercomCallEndedEvent = z.object({
//   kind: z.literal('intercom-call-ended'),
//   callId: z.string().nonempty(),
// });

export const intercomTerminalEventSchemaByKind = {
  'call-state-changed': sCallStateChanged,
};

export type CallStateChangedEvent = z.infer<typeof sCallStateChanged>;

export type IntercomTerminalEvent = CallStateChangedEvent;
