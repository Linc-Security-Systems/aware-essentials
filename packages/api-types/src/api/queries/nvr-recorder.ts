import { sDeviceParam, sFileResponse } from '../../primitives';
import { z } from 'zod';
import { sRecordingSequence } from '../rest/media';

// QUERIES

// -- Recordings by Time Range

export const QUERY_RECORDINGS_BY_TIME_RANGE = 'cctv:recordings-by-time-range';

export const sRecordingsByTimeRangeArgs = z.object({
  device: sDeviceParam,
  timeFrom: z.number(),
  timeTo: z.number(),
});

export const sRecordingsResponse = z.array(sRecordingSequence);

export type RecordingsByTimeRangeArgs = z.infer<
  typeof sRecordingsByTimeRangeArgs
>;

export type RecordingsResponse = z.infer<typeof sRecordingsResponse>;

// -- Preview Image

export const QUERY_PREVIEW_IMAGE = 'cctv:preview-image';

export const sPreviewImageArgs = z.object({
  device: sDeviceParam,
  time: z.number(),
  height: z.number(),
});

export const sPreviewImageResponse = sFileResponse;

export type PreviewImageArgs = z.infer<typeof sPreviewImageArgs>;

export type PreviewImageResponse = z.infer<typeof sPreviewImageResponse>;

// -- Camera Latest Frame

export const QUERY_CAMERA_LATEST_FRAME = 'cctv:latest-frame';

export const sCameraLatestFrameArgs = z.object({
  device: sDeviceParam,
  width: z.number(),
  height: z.number(),
});

export const sCameraLatestFrameResponse = sFileResponse;

export type CameraLatestFrameArgs = z.infer<typeof sCameraLatestFrameArgs>;

export type CameraLatestFrameResponse = z.infer<
  typeof sCameraLatestFrameResponse
>;

export const nvrRecorderRequestSchemas = {
  [QUERY_RECORDINGS_BY_TIME_RANGE]: sRecordingsByTimeRangeArgs,
  [QUERY_PREVIEW_IMAGE]: sPreviewImageArgs,
  [QUERY_CAMERA_LATEST_FRAME]: sCameraLatestFrameArgs,
} as const;

// Dictionary of response schemas by query type
export const nvrRecorderResponseSchemas = {
  [QUERY_RECORDINGS_BY_TIME_RANGE]: sRecordingsResponse,
  [QUERY_PREVIEW_IMAGE]: sPreviewImageResponse,
  [QUERY_CAMERA_LATEST_FRAME]: sCameraLatestFrameResponse,
} as const;

// TypeScript mapping types for requests and responses
export type NvrRecorderQueryRequestMap = {
  [QUERY_RECORDINGS_BY_TIME_RANGE]: RecordingsByTimeRangeArgs;
  [QUERY_PREVIEW_IMAGE]: PreviewImageArgs;
  [QUERY_CAMERA_LATEST_FRAME]: CameraLatestFrameArgs;
};

export type NvrRecorderQueryResponseMap = {
  [QUERY_RECORDINGS_BY_TIME_RANGE]: RecordingsResponse;
  [QUERY_PREVIEW_IMAGE]: PreviewImageResponse;
  [QUERY_CAMERA_LATEST_FRAME]: CameraLatestFrameResponse;
};
