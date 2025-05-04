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

export interface IntercomTerminalStateDto {
  connected: boolean;
  clientId: number | null;
  callId: string | null;
  userAgentId: string | null;
  offerSdp: string | null;
  answerSdp: string | null;
  callState: 'idle' | 'ringing' | 'active';
}

// EVENTS

export const sIntercomCallEvent = z.object({
  kind: z.literal('intercom-call'),
  userId: z.string().optional(),
  personId: z.string().optional(),
  callId: z.string().nonempty(),
  offerSdp: z.string().nonempty(),
});

export const sIntercomCallCancelledEvent = z.object({
  kind: z.literal('intercom-call-cancelled'),
  userId: z.string().optional(),
  callId: z.string().nonempty(),
});

export const sIntercomCallAnsweredEvent = z.object({
  kind: z.literal('intercom-call-answered'),
  userId: z.string().optional(),
  userAgentId: z.string().nonempty(),
  callId: z.string().nonempty(),
  answerSdp: z.string().nonempty(),
});

export const sIntercomCallEndedEvent = z.object({
  kind: z.literal('intercom-call-ended'),
  callId: z.string().nonempty(),
});

export const intercomTerminalEventSchemaByKind = {
  'intercom-call': sIntercomCallEvent,
  'intercom-call-cancelled': sIntercomCallCancelledEvent,
  'intercom-call-answered': sIntercomCallAnsweredEvent,
  'intercom-call-ended': sIntercomCallEndedEvent,
};

export type IntercomCallEvent = z.infer<typeof sIntercomCallEvent>;

export type IntercomCallCancelledEvent = z.infer<
  typeof sIntercomCallCancelledEvent
>;

export type IntercomCallAnsweredEvent = z.infer<
  typeof sIntercomCallAnsweredEvent
>;

export type IntercomCallEndedEvent = z.infer<typeof sIntercomCallEndedEvent>;

export type IntercomTerminalEvent =
  | IntercomCallEvent
  | IntercomCallCancelledEvent
  | IntercomCallAnsweredEvent
  | IntercomCallEndedEvent;
