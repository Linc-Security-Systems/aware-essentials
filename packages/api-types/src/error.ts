import { z } from 'zod';

// METADATA

export const sDuplicateMeta = z.object({
  subject: z.string(),
  field: z.string(),
  value: z.string().optional(),
  existingId: z.string().optional(), // UUID or whatever
});

export const sNotFoundMeta = z.object({
  subject: z.string(),
  field: z.string(),
  value: z.string(),
});

export const sInvalidMeta = z.object({
  subject: z.string(),
  fieldErrors: z.record(z.string()), // key → human msg
});

export const sConflictMeta = z.object({
  subject: z.string(),
  blockingSubject: z.string().optional(),
  blockingId: z.string().optional(),
  value: z.string().optional(),
});

export const sVoidMeta = z.object({}).strict();

export const sAccessRuleConflictMeta = z.object({
  deviceSchedules: z.record(z.string(), z.array(z.string())),
});

export const sZoneAccessRuleConflictMeta = z.object({
  zoneId: z.string(),
  accessRuleIds: z.array(z.string()),
});

export type VoidMeta = z.infer<typeof sVoidMeta>;
export type DuplicateMeta = z.infer<typeof sDuplicateMeta>;
export type NotFoundMeta = z.infer<typeof sNotFoundMeta>;
export type InvalidMeta = z.infer<typeof sInvalidMeta>;
export type ConflictMeta = z.infer<typeof sConflictMeta>;

export type AccessRuleConflictMeta = z.infer<typeof sAccessRuleConflictMeta>;

// ERROR CODES

export enum AppErrorCode {
  // generic
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_FORBIDDEN = 'RESOURCE_FORBIDDEN',
  RESOURCE_INVALID = 'RESOURCE_INVALID',
  RESOURCE_IN_USE = 'RESOURCE_IN_USE',
  RESOURCE_NOT_SUPPORTED = 'RESOURCE_NOT_SUPPORTED',
  BAD_REFERENCE = 'BAD_REFERENCE',
  UNKNOWN = 'UNKNOWN',
  SERVER_INTERNAL_ERROR = 'SERVER_INTERNAL_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  BAD_REQUEST = 'BAD_REQUEST',

  // access
  ACCESS_RULE_NOT_FOUND = 'ACCESS_RULE_NOT_FOUND',
  ACCESS_RULE_PERMISSION_CONFLICT = 'ACCESS_RULE_PERMISSION_CONFLICT',

  // alarm
  ALARM_NOT_FOUND = 'ALARM_NOT_FOUND',

  // auth / user
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USERNAME_ALREADY_EXISTS = 'USERNAME_ALREADY_EXISTS',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  CANNOT_DELETE_ROOT_USER = 'CANNOT_DELETE_ROOT_USER',

  // person / token
  PERSON_NOT_FOUND = 'PERSON_NOT_FOUND',
  PERSON_INVALID_ID = 'PERSON_INVALID_ID',
  TOKEN_NOT_SUPPORTED = 'TOKEN_NOT_SUPPORTED',
  TOKEN_INVALID_FORMAT = 'TOKEN_INVALID_FORMAT',
  TOKEN_LIMIT_EXCEEDED = 'TOKEN_LIMIT_EXCEEDED',
  TOKEN_IN_USE = 'TOKEN_IN_USE',

  // device
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  DEVICE_ALREADY_EXISTS = 'DEVICE_ALREADY_EXISTS',
  DEVICE_INVALID_ID = 'DEVICE_INVALID_ID',
  DEVICE_INVALID_TYPE = 'DEVICE_INVALID_TYPE',
  DEVICE_INVALID_RELATION_TYPE = 'DEVICE_INVALID_RELATION_TYPE',
  DEVICE_INVALID_TEMPLATE = 'DEVICE_INVALID_TEMPLATE',
  DEVICE_INVALID_PROVIDER_METADATA = 'DEVICE_INVALID_PROVIDER_METADATA',
  DEVICE_PRESET_ALREADY_EXISTS = 'DEVICE_PRESET_ALREADY_EXISTS',
  DEVICE_NOT_SUPPORTED = 'DEVICE_NOT_SUPPORTED',

  // group / zone / schedule
  GROUP_NOT_FOUND = 'GROUP_NOT_FOUND',
  GROUP_ALREADY_EXISTS = 'GROUP_ALREADY_EXISTS',
  ZONE_NOT_FOUND = 'ZONE_NOT_FOUND',
  ZONE_ALREADY_EXISTS = 'ZONE_ALREADY_EXISTS',
  ZONE_IN_USE = 'ZONE_IN_USE',
  ZONE_ACCESS_RULE_CONFLICT = 'ZONE_ACCESS_RULE_CONFLICT',
  SCHEDULE_NOT_FOUND = 'SCHEDULE_NOT_FOUND',
  SCHEDULE_ALREADY_EXISTS = 'SCHEDULE_ALREADY_EXISTS',
  SCHEDULE_IN_USE = 'SCHEDULE_IN_USE',

  // permission / role
  PERMISSION_ALREADY_EXISTS = 'PERMISSION_ALREADY_EXISTS',
  ROLE_ALREADY_EXISTS = 'ROLE_ALREADY_EXISTS',
  ADMIN_ROLE_CANNOT_UPDATE = 'ADMIN_ROLE_CANNOT_UPDATE',
  ADMIN_ROLE_CANNOT_DELETE = 'ADMIN_ROLE_CANNOT_DELETE',

  // automation / rules
  RULE_ALREADY_EXISTS = 'RULE_ALREADY_EXISTS',
  RULE_INVALID_BODY = 'RULE_INVALID_BODY',
  RULE_MISSING_CODE = 'RULE_MISSING_CODE',

  // layout / view
  LAYOUT_ALREADY_EXISTS = 'LAYOUT_ALREADY_EXISTS',
  VIEW_ALREADY_EXISTS = 'VIEW_ALREADY_EXISTS',

  // config
  CONFIG_INVALID = 'CONFIG_INVALID',
}

export const errorMetadataSchemas = {
  [AppErrorCode.RESOURCE_ALREADY_EXISTS]: sDuplicateMeta,
  [AppErrorCode.RESOURCE_NOT_FOUND]: sNotFoundMeta,
  [AppErrorCode.RESOURCE_INVALID]: sInvalidMeta,
  [AppErrorCode.RESOURCE_IN_USE]: sConflictMeta,
  [AppErrorCode.RESOURCE_NOT_SUPPORTED]: sVoidMeta,
  [AppErrorCode.RESOURCE_FORBIDDEN]: sVoidMeta,
  [AppErrorCode.BAD_REFERENCE]: sVoidMeta,
  // access
  [AppErrorCode.ACCESS_RULE_NOT_FOUND]: sNotFoundMeta,
  [AppErrorCode.ACCESS_RULE_PERMISSION_CONFLICT]: sAccessRuleConflictMeta,
  // alarm
  [AppErrorCode.ALARM_NOT_FOUND]: sNotFoundMeta,
  // auth / user
  [AppErrorCode.AUTH_INVALID_CREDENTIALS]: sVoidMeta,
  [AppErrorCode.USER_NOT_FOUND]: sNotFoundMeta,
  [AppErrorCode.USERNAME_ALREADY_EXISTS]: sDuplicateMeta,
  [AppErrorCode.EMAIL_ALREADY_EXISTS]: sDuplicateMeta,
  [AppErrorCode.CANNOT_DELETE_ROOT_USER]: sVoidMeta,
  // person / token
  [AppErrorCode.PERSON_NOT_FOUND]: sNotFoundMeta,
  [AppErrorCode.PERSON_INVALID_ID]: sInvalidMeta,
  [AppErrorCode.TOKEN_NOT_SUPPORTED]: sVoidMeta,
  [AppErrorCode.TOKEN_INVALID_FORMAT]: sInvalidMeta,
  [AppErrorCode.TOKEN_LIMIT_EXCEEDED]: sVoidMeta,
  [AppErrorCode.TOKEN_IN_USE]: sConflictMeta,
  // device
  [AppErrorCode.DEVICE_NOT_FOUND]: sNotFoundMeta,
  [AppErrorCode.DEVICE_ALREADY_EXISTS]: sDuplicateMeta,
  [AppErrorCode.DEVICE_INVALID_ID]: sInvalidMeta,
  [AppErrorCode.DEVICE_INVALID_TYPE]: sInvalidMeta,
  [AppErrorCode.DEVICE_INVALID_RELATION_TYPE]: sInvalidMeta,
  [AppErrorCode.DEVICE_INVALID_TEMPLATE]: sInvalidMeta,
  [AppErrorCode.DEVICE_INVALID_PROVIDER_METADATA]: sInvalidMeta,
  [AppErrorCode.DEVICE_PRESET_ALREADY_EXISTS]: sDuplicateMeta,
  [AppErrorCode.DEVICE_NOT_SUPPORTED]: sVoidMeta,
  // group / zone / schedule
  [AppErrorCode.GROUP_NOT_FOUND]: sNotFoundMeta,
  [AppErrorCode.GROUP_ALREADY_EXISTS]: sDuplicateMeta,
  [AppErrorCode.ZONE_NOT_FOUND]: sNotFoundMeta,
  [AppErrorCode.ZONE_ALREADY_EXISTS]: sDuplicateMeta,
  [AppErrorCode.ZONE_IN_USE]: sConflictMeta,
  [AppErrorCode.ZONE_ACCESS_RULE_CONFLICT]: sZoneAccessRuleConflictMeta,
  [AppErrorCode.SCHEDULE_NOT_FOUND]: sNotFoundMeta,
  [AppErrorCode.SCHEDULE_ALREADY_EXISTS]: sDuplicateMeta,
  [AppErrorCode.SCHEDULE_IN_USE]: sConflictMeta,
  // permission / role
  [AppErrorCode.PERMISSION_ALREADY_EXISTS]: sDuplicateMeta,
  [AppErrorCode.ROLE_ALREADY_EXISTS]: sDuplicateMeta,
  [AppErrorCode.ADMIN_ROLE_CANNOT_UPDATE]: sVoidMeta,
  [AppErrorCode.ADMIN_ROLE_CANNOT_DELETE]: sVoidMeta,
  // automation / rules
  [AppErrorCode.RULE_ALREADY_EXISTS]: sDuplicateMeta,
  [AppErrorCode.RULE_INVALID_BODY]: sInvalidMeta,
  [AppErrorCode.RULE_MISSING_CODE]: sVoidMeta,
  // layout / view
  [AppErrorCode.LAYOUT_ALREADY_EXISTS]: sDuplicateMeta,
  [AppErrorCode.VIEW_ALREADY_EXISTS]: sDuplicateMeta,
  // config
  [AppErrorCode.CONFIG_INVALID]: sInvalidMeta,
  [AppErrorCode.UNKNOWN]: sVoidMeta,
  [AppErrorCode.SERVER_INTERNAL_ERROR]: sVoidMeta,
  [AppErrorCode.UNAUTHORIZED]: sVoidMeta,
  [AppErrorCode.BAD_REQUEST]: sVoidMeta,
} as const satisfies Record<AppErrorCode, z.ZodTypeAny>;

type AppErrorMetadataSchemaMap = typeof errorMetadataSchemas;

export type AppErrorMetadataMap = {
  [K in keyof AppErrorMetadataSchemaMap]: z.infer<AppErrorMetadataSchemaMap[K]>;
};

export type ErrorResponse = {
  [K in AppErrorCode]: {
    code: K;
    message: string; // UI-friendly text
    metadata: AppErrorMetadataMap[K]; // strongly typed
  };
}[AppErrorCode];

export function isErrorResponse(err: unknown): err is ErrorResponse {
  return (
    !!err &&
    typeof err === 'object' &&
    'code' in err &&
    Object.values(AppErrorCode).includes((err as any).code)
  );
}
