import { sCallDirection, sCallState } from '../primitives';
import { z } from 'zod';

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

export const intercomTerminalEventSchemaByKind = {
  'call-state-changed': sCallStateChanged,
};

export type CallStateChangedEvent = z.infer<typeof sCallStateChanged>;

export type IntercomTerminalEvent = CallStateChangedEvent;
