import { z } from 'zod';

export const CAMERA = 'camera' as const;

// SPECS

export const sWebRtcPlaybackSource = z
  .object({
    kind: z.string(),
  })
  .and(z.record(z.string(), z.unknown()));

export const sStreamInfo = z.object({
  id: z.string().nonempty(),
  displayName: z.string().nonempty(),
  externalPlayerUrl: z.string().nullable(),
  rtspUrl: z.string().nonempty().nullable(),
  width: z.number().positive().nullable(),
  height: z.number().positive().nullable(),
  lensType: z.enum(['flat', 'fisheye']),
  mountPoint: z.enum(['wall', 'ceiling', 'floor']),
  webrtcPlaybackSource: sWebRtcPlaybackSource.nullable(),
});

export const sCameraSpecs = z.object({
  ptzCapable: z.boolean(),
  ptzPanSpeed: z.number(),
  ptzTiltSpeed: z.number(),
  ptzZoomSpeed: z.number(),
  panMin: z.number().min(-1).max(1),
  panMax: z.number().min(-1).max(1),
  tiltMin: z.number().min(-1).max(1),
  tiltMax: z.number().min(-1).max(1),
  zoomMin: z.number().min(0).max(1),
  zoomMax: z.number().min(0).max(1),
  streams: z.array(sStreamInfo),
  defaultStreamId: z.string().nonempty(),
  autoSwitchStreams: z.boolean(),
  streamNaming: z.enum(['cameraStreamNo', 'cameraStream', 'stream']),
});

export type WebRtcPlaybackSource = z.infer<typeof sWebRtcPlaybackSource>;

export type CameraSpecs = z.infer<typeof sCameraSpecs>;

// STATE

export const sMotionDetectionConfiguration = z.object({
  threshold: z.number().min(0).max(1).optional(),
  fps: z.number().int().positive().optional(),
});

export type MotionDetectionConfiguration = z.infer<
  typeof sMotionDetectionConfiguration
>;

// --- label detection module ---

export const sAiLabelConfiguration = z.object({
  threshold: z.number().min(0).max(1).optional(),
});

export type AiLabelConfiguration = z.infer<typeof sAiLabelConfiguration>;

export const sAiDetectionConfiguration = z.object({
  labels: z.record(z.string(), sAiLabelConfiguration),
  fps: z.number().int().positive().optional(),
});

export type AiDetectionConfiguration = z.infer<
  typeof sAiDetectionConfiguration
>;

// --- face recognition module ---

export const sAiFaceRecognitionConfiguration = z.object({
  threshold: z.number().min(0).max(1).optional(),
  fps: z.number().int().positive().optional(),
});

export type AiFaceRecognitionConfiguration = z.infer<
  typeof sAiFaceRecognitionConfiguration
>;

// --- semantic search module ---

export const sAiSemanticSearchConfiguration = z.object({
  fps: z.number().int().positive().optional(),
});

export type AiSemanticSearchConfiguration = z.infer<
  typeof sAiSemanticSearchConfiguration
>;

// --- stream configuration ---

export const sAiStreamConfiguration = z.object({
  motionDetection: sMotionDetectionConfiguration.optional(),
  labelDetection: sAiDetectionConfiguration.optional(),
  faceRecognition: sAiFaceRecognitionConfiguration.optional(),
  semanticSearch: sAiSemanticSearchConfiguration.optional(),
});

export const sAiCapability = z.enum([
  'motionDetection',
  'labelDetection',
  'faceRecognition',
  'semanticSearch',
]);

export type AiCapability = z.infer<typeof sAiCapability>;

export type AiStreamConfiguration = z.infer<typeof sAiStreamConfiguration>;

// all together now: AI inference relation data

export const sAnalyticsConfigData = z.object({
  streams: z.record(z.string(), sAiStreamConfiguration),
});

export const sCameraState = z.object({
  pan: z.number().min(-1).max(1),
  tilt: z.number().min(-1).max(1),
  zoom: z.number().min(0).max(1),
  enabled: z.boolean(),
  connected: z.boolean(),
  analytics: sAnalyticsConfigData,
  // TODO recording: ...
});

export type CameraStateDto = z.infer<typeof sCameraState>;

export type AnalyticsConfigData = z.infer<typeof sAnalyticsConfigData>;
