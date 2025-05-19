import { z } from 'zod';
import { sObjectKind } from './device';

export const sErrorNotFound = z.object({
  objectId: z.string(),
  objectKind: sObjectKind,
});

export const sErrorInvalid = z.object({
  objectId: z.string(),
  objectKind: sObjectKind,
});

export const sErrorNotSupported = z.object({
  objectId: z.string(),
  objectKind: sObjectKind,
});

export const sErrorNotUnique = z.object({
  objectId: z.string(),
  objectKind: sObjectKind,
  conflictingObjectId: z.string().optional(),
});

export const sErrorInvalidFormat = z.object({
  value: z.string(),
  path: z.string(),
});

export const sErrorMissingField = z.object({
  path: z.string(),
});

export const sErrorNotUniqueValue = z.object({
  value: z.string(),
  path: z.string(),
});

export const sErrorList = z.object({
  errors: z.array(
    z.union([
      sErrorNotFound,
      sErrorInvalid,
      sErrorNotSupported,
      sErrorNotUnique,
      sErrorInvalidFormat,
      sErrorMissingField,
      sErrorNotUniqueValue,
    ]),
  ),
});

export type ErrorNotFound = z.infer<typeof sErrorNotFound>;
export type ErrorInvalid = z.infer<typeof sErrorInvalid>;
export type ErrorNotSupported = z.infer<typeof sErrorNotSupported>;
export type ErrorNotUnique = z.infer<typeof sErrorNotUnique>;
export type ErrorInvalidFormat = z.infer<typeof sErrorInvalidFormat>;
export type ErrorMissingField = z.infer<typeof sErrorMissingField>;
export type ErrorNotUniqueValue = z.infer<typeof sErrorNotUniqueValue>;
export type ErrorList = z.infer<typeof sErrorList>;

export const errorDetailsMap = {
  'not-found': sErrorNotFound,
  invalid: sErrorInvalid,
  'not-supported': sErrorNotSupported,
  'not-unique': sErrorNotUnique,
  'invalid-format': sErrorInvalidFormat,
  'missing-field': sErrorMissingField,
  'not-unique-value': sErrorNotUniqueValue,
  list: sErrorList,
  // Add more error types here as needed
} as const;

export type ErrorDetailsMap = {
  [K in keyof typeof errorDetailsMap]: z.infer<(typeof errorDetailsMap)[K]>;
};

export type ErrorCode = keyof typeof errorDetailsMap;

export type ErrorDetails = z.infer<
  (typeof errorDetailsMap)[keyof typeof errorDetailsMap]
>;

export type ErrorResponse = {
  [K in keyof typeof errorDetailsMap]: {
    code: K;
    message: string;
    details: z.infer<(typeof errorDetailsMap)[K]>;
  };
}[keyof typeof errorDetailsMap];

export const isErrorResponse = (obj: unknown): obj is ErrorResponse => {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  if (!('code' in obj)) {
    return false;
  }
  const code = (obj as { code: string }).code;
  if (typeof (obj as { code: unknown }).code !== 'string') {
    return false;
  }
  if (!('message' in obj)) {
    return false;
  }
  if (typeof (obj as { message: unknown }).message !== 'string') {
    return false;
  }
  if (!('details' in obj)) {
    return false;
  }
  const details = (obj as { details: unknown }).details;
  if (typeof details !== 'object' || details === null) {
    return false;
  }
  if (!errorDetailsMap[code as keyof typeof errorDetailsMap]) {
    return false;
  }

  const schema = errorDetailsMap[code as keyof typeof errorDetailsMap];
  if (!schema.safeParse(details).success) {
    return false;
  }
  return true;
};

export const isErrorOfCode = <T extends ErrorCode>(
  error: unknown,
  code: T,
): error is ErrorResponse & { code: T } => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  if (!('code' in error)) {
    return false;
  }
  if (typeof (error as { code: unknown }).code !== 'string') {
    return false;
  }
  if ((error as { code: unknown }).code !== code) {
    return false;
  }
  if (!('details' in error)) {
    return false;
  }
  const details = (error as { details: unknown }).details;
  if (typeof details !== 'object' || details === null) {
    return false;
  }
  if (!errorDetailsMap[code].safeParse(details).success) {
    return false;
  }
  return true;
};

// export type ErrorDetailsMap = {
//   'not-found': ErrorNotFound;
//   invalid: ErrorInvalid;
//   'not-supported': ErrorNotSupported;
//   'not-unique': ErrorNotUnique;
// };

// export const sErrorResponse = z.object({});

// export type ErrorResponse = z.infer<typeof sErrorResponse>;

// export const isErrorResponse = (obj: unknown): obj is ErrorResponse =>
//   sErrorResponse.safeParse(obj).success;
