import z from 'zod';
import { WebSocketMessage } from './web-socket';

export const sProgress = z.object({
  total: z.number().optional(),
  complete: z.number().optional(),
  failed: z.object({}).default({}),
});

export type ProgressReport = z.infer<typeof sProgress>;

export const sProgressUpdate = z.object({
  timestamp: z.number(),
  item: z.string(),
  progress: sProgress,
});

export type ProgressUpdatePayload = z.infer<typeof sProgressUpdate>;

export const sProgressUnavailable = z.object({
  timestamp: z.number(),
  item: z.string(),
});

export type ProgressUnavailablePayload = z.infer<typeof sProgressUnavailable>;

export const sProgressUpdateError = z.object({
  timestamp: z.number(),
  item: z.string(),
  error: z.object({}),
});

export type ProgressUpdateErrorPayload = z.infer<typeof sProgressUpdateError>;

export const sProgressSubscribe = z.object({
  timestamp: z.number(),
  requestId: z.string(),
  item: z.string(),
});

export type ProgressSubscribePayload = z.infer<typeof sProgressSubscribe>;

export const sProgressUnsubscribe = z.object({
  timestamp: z.number(),
  requestId: z.string(),
  item: z.string(),
});

export type ProgressUnsubscribePayload = z.infer<typeof sProgressUnsubscribe>;

interface ProgressMessageMap {
  'progress-update': ProgressUpdatePayload;
  'progress-unavailable': ProgressUnavailablePayload;
  'progress-update-error': ProgressUpdateErrorPayload;
  'progress-subscribe': ProgressSubscribePayload;
  'progress-unsubscribe': ProgressUnsubscribePayload;
}

const validators: { [K in keyof ProgressMessageMap]: z.ZodObject<any> } = {
  'progress-update': sProgressUpdate,
  'progress-unavailable': sProgressUnavailable,
  'progress-update-error': sProgressUpdateError,
  'progress-subscribe': sProgressSubscribe,
  'progress-unsubscribe': sProgressUnsubscribe,
};

export type ProgressWsMessage = {
  [K in keyof ProgressMessageMap]: {
    event: K;
    data: ProgressMessageMap[K];
  };
}[keyof ProgressMessageMap];

export const isProgressMessage = (
  message: WebSocketMessage,
): message is ProgressWsMessage => {
  const validator = validators[message.event as keyof ProgressMessageMap];
  if (!validator) {
    return false;
  }
  return validator.safeParse(message.data).success;
};
