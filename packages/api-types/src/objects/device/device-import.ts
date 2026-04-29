import { z } from 'zod';
import {
  DeviceDto,
  sAnyDeviceSpecs,
  sDeviceDto,
  sForeignDeviceInfo,
} from './any-device';
import { sDeviceRelationDto } from './device-relation';

export const sImportedDevice = z
  .object({
    tags: z.array(z.string()).optional(),
  })
  .and(sForeignDeviceInfo)
  .and(sAnyDeviceSpecs);

export const sDuplicateDevice = z.object({
  name: z.string(),
  refs: z.array(z.string()),
});

export const sDeviceDiscoveryDto = z.object({
  devices: z.array(sImportedDevice),
  relations: z.array(
    sDeviceRelationDto.and(z.object({ provider: z.string() })),
  ),
});

export const sRelationDeltaDto = z.object({
  relation: sDeviceRelationDto,
  action: z.enum(['added', 'updated', 'removed']),
});

export type RelationDeltaDto = z.infer<typeof sRelationDeltaDto>;

export const sDeviceGetChangesDto = z.object({
  added: z.array(sImportedDevice),
  updated: z.array(
    z
      .object({
        id: z.string(),
        provider: z.string(),
        foreignRef: z.string(),
      })
      .catchall(z.unknown()),
  ),
  removed: z.array(sDeviceDto),
  relations: z.array(sRelationDeltaDto),
  duplicates: z.array(sDuplicateDevice),
});

export type ImportedDevice = z.infer<typeof sImportedDevice>;

export type DuplicateDevice = z.infer<typeof sDuplicateDevice>;

export type DeviceGetChangesDto = {
  added: ImportedDevice[];
  updated: ({
    id: string;
    provider: string;
    foreignRef: string;
  } & Partial<ImportedDevice>)[];
  removed: DeviceDto[];
  relations: RelationDeltaDto[];
  duplicates: DuplicateDevice[];
};

export type DeviceDiscoveryDto = z.infer<typeof sDeviceDiscoveryDto>;
