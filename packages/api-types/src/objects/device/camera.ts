import { z } from 'zod';

export const CAMERA = 'camera' as const;

// SPECS

export const sWebRtcPlaybackSource = z
  .object({
    kind: z.string(),
  })
  .and(z.record(z.unknown()));

export const sStreamInfo = z.object({
  id: z.string().nonempty(),
  displayName: z.string().nonempty(),
  externalPlayerUrl: z.string().nullable(),
  rtspUrl: z.string().nonempty().nullable(),
  recordingCapable: z.boolean(),
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
  streamNaming: z.enum(['cameraStreamNo', 'cameraStream', 'stream']),
});

export type WebRtcPlaybackSource = z.infer<typeof sWebRtcPlaybackSource>;

export type CameraSpecs = z.infer<typeof sCameraSpecs>;

// STATE

export interface CameraStateDto {
  pan: number;
  tilt: number;
  zoom: number;
  enabled: boolean;
  objectDetectionEnabled: boolean;
  connected: boolean;
}
