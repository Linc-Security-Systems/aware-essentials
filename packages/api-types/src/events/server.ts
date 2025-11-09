import { z } from 'zod';
import { ObjectKinds } from '../objects';

// EVENTS

export const sAgentStarted = z.object({
  kind: z.literal('agent-started'),
  agent: z.string(),
  providers: z.array(z.string()),
});

export const sAgentStopped = z.object({
  kind: z.literal('agent-stopped'),
  agent: z.string(),
  providers: z.array(z.string()),
});

export type AgentStarted = z.infer<typeof sAgentStarted>;
export type AgentStopped = z.infer<typeof sAgentStopped>;

export type ObjectCreated = {
  [K in keyof ObjectKinds]: {
    originator: string;
    objectVersion: number;
    objectKind: K;
    data: ObjectKinds[K];
    objectId: string;
    kind: 'object-created';
    userId?: string;
  };
}[keyof ObjectKinds];

export type ObjectUpdated = {
  [K in keyof ObjectKinds]: {
    originator: string;
    objectVersion: number;
    objectKind: K;
    original: ObjectKinds[K];
    changes: Partial<ObjectKinds[K]>;
    objectId: string;
    kind: 'object-updated';
    userId?: string;
  };
}[keyof ObjectKinds];

export type ObjectDeleted = {
  [K in keyof ObjectKinds]: {
    originator: string;
    objectVersion: number;
    objectKind: K;
    data: ObjectKinds[K];
    objectId: string;
    kind: 'object-deleted';
    userId?: string;
  };
}[keyof ObjectKinds];

export type ServerEvent =
  | ObjectCreated
  | ObjectUpdated
  | ObjectDeleted
  | AgentStarted
  | AgentStopped;
