import { z } from 'zod';

export const SYSTEM = 'system' as const;

// SPECS

export const sSystemDeviceSpecs = z.object({});
export type SystemDeviceSpecs = z.infer<typeof sSystemDeviceSpecs>;

// STATE

export const sSystemDeviceStateDto = z.record(z.unknown());
export type SystemDeviceStateDto = z.infer<typeof sSystemDeviceStateDto>;
