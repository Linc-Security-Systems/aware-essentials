import { ObjectKinds } from '../../objects';
import { z } from 'zod';
import { sSecurityLevelRef, sUserId } from '../../primitives';

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

export const sUserLoggedIn = z.object({
  kind: z.literal('user-logged-in'),
  userId: sUserId,
});

export const sUserLoggedOut = z.object({
  kind: z.literal('user-logged-out'),
  userId: sUserId,
});

export type UserLoggedIn = z.infer<typeof sUserLoggedIn>;
export type UserLoggedOut = z.infer<typeof sUserLoggedOut>;

export const sMacroActivated = z.object({
  kind: z.literal('macro-activated'),
  macroId: z.string(),
  displayName: z.string(),
});

export const sAccessPathActivated = z.object({
  kind: z.literal('access-path-activated'),
  macroId: z.string(),
  displayName: z.string(),
});

export type MacroActivated = z.infer<typeof sMacroActivated>;
export type AccessPathActivated = z.infer<typeof sAccessPathActivated>;

export const sTimeZoneChanged = z.object({
  kind: z.literal('time-zone-changed'),
  timeZone: z.string(), // new IANA zone, e.g. 'Africa/Cairo' or 'Etc/GMT-3'
  previousTimeZone: z.string(),
  userId: z.string().optional(), // matches the other server events
});
export type TimeZoneChanged = z.infer<typeof sTimeZoneChanged>;

// ids are NO_SECURITY_LEVEL and names null when no level is active; names are snapshots taken at the time of the change
export const sSecurityLevelChanged = z.object({
  kind: z.literal('security-level-changed'),
  securityLevelId: sSecurityLevelRef,
  name: z.string().nullable(),
  previousSecurityLevelId: sSecurityLevelRef,
  previousName: z.string().nullable(),
  userId: z.string().optional(),
});
export type SecurityLevelChanged = z.infer<typeof sSecurityLevelChanged>;

// paths only, never values: module sections hold credentials
export const sConfigUpdated = z.object({
  kind: z.literal('config-updated'),
  section: z.string(), // 'app' for app settings, else the module's provider
  paths: z.array(z.string()), // dotted paths that changed, e.g. 'auth.password.minLength'
  enabled: z.boolean().optional(), // modules only: whether it is enabled after the save
  userId: z.string().optional(),
});
export type ConfigUpdated = z.infer<typeof sConfigUpdated>;

export const serverEventSchemasByKind = {
  'security-level-changed': sSecurityLevelChanged,
  'config-updated': sConfigUpdated,
} as const;

export type ServerEvent =
  | ObjectCreated
  | ObjectUpdated
  | ObjectDeleted
  | AgentStarted
  | AgentStopped
  | UserLoggedIn
  | UserLoggedOut
  | MacroActivated
  | AccessPathActivated
  | TimeZoneChanged
  | SecurityLevelChanged
  | ConfigUpdated;
