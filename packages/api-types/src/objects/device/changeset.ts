// api-types: objects/device/changeset.ts
import { z } from 'zod';

export const CONFIG_STATE_KEY = 'deviceChanges';
export const COMMIT_STEP_REF = '<commit>';
export const MAX_STEP_ATTEMPTS = 3;

export const sChangesetId = z.string();

/** `check` is reserved for verification steps; nothing emits it yet. */
export const sStepKind = z.enum(['effect', 'check']);

/** `skipped`: a step this one depended on failed, so it never ran. */
export const sStepStatus = z.enum([
  'waiting',
  'running',
  'succeeded',
  'failed',
  'skipped',
]);

export const sStep = z.object({
  /** `<planner>/<deviceId>/<ref>`, unique within the changeset. */
  ref: z.string().min(1),
  deviceId: z.string(),
  kind: sStepKind,
  type: z.string().min(1),
  label: z.string(),
  dependsOn: z.array(z.string()),
  status: sStepStatus,
  attempt: z.number().int().min(0).max(MAX_STEP_ATTEMPTS),
  startedAt: z.number().int().nullable(),
  finishedAt: z.number().int().nullable(),
  error: z.object({ name: z.string(), message: z.string() }).nullable(),
});

export const sDeviceChange = z.enum([
  'add',
  'update',
  'remove',
  'relation',
  'reconcile',
]);

export const sChangesetDevice = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  change: sDeviceChange,
});

export const sChangesetPhase = z.enum(['pending', 'committing', 'failed']);

export const sChangesetFailure = z.object({
  /** `COMMIT_STEP_REF` when the commit itself failed. */
  stepRef: z.string(),
  message: z.string(),
  at: z.number().int(),
});

export const sChangeset = z.object({
  id: sChangesetId,
  phase: sChangesetPhase,
  label: z.string(),
  /** `http/<X-Request-Id>` or `system/boot`. How a client recognises its own. */
  originator: z.string(),
  by: z.object({ id: z.string(), name: z.string() }).nullable(),
  /** 1 on proposal, +1 per retry. The id never changes. */
  attempt: z.number().int().min(1),
  proposedAt: z.number().int(),
  updatedAt: z.number().int(),
  devices: z.record(z.string(), sChangesetDevice),
  steps: z.array(sStep),
  failure: sChangesetFailure.nullable(),
});

/** Server device state, key `configState`. Committed changesets are absent. */
export const sConfigState = z.object({
  changesets: z.record(sChangesetId, sChangeset),
});

/** Any existing touched device's state, key `configState`. Absent when untouched. */
export const sDeviceConfigState = z.object({
  changesetId: sChangesetId,
  phase: sChangesetPhase,
});

export type Step = z.infer<typeof sStep>;
export type StepStatus = z.infer<typeof sStepStatus>;
export type ChangesetDevice = z.infer<typeof sChangesetDevice>;
export type ChangesetPhase = z.infer<typeof sChangesetPhase>;
export type Changeset = z.infer<typeof sChangeset>;
export type ConfigState = z.infer<typeof sConfigState>;
export type DeviceConfigState = z.infer<typeof sDeviceConfigState>;
