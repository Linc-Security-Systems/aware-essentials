export const PRESENCE_TRACKER = 'presence-tracker';

// SPECS

// STATE

export interface PresenceTrackerState {
  zonePeople: Record<string, string[]>;
}
