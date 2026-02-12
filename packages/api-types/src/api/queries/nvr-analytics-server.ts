import { z } from 'zod';
import { sFileResponse } from '../../primitives';
import { sSortOptions } from '../rest/media';

// QUERIES

// -- Media Search

export const QUERY_MEDIA_SEARCH = 'cctv:media-search';

export const sMediaSearchArgs = z
  .object({
    devices: z.array(z.any()).optional(),
    limit: z.number().nonnegative(),
    q: z.string(),
    similarTo: z.string().optional(),
    label: z.array(z.string().nonempty()),
    subLabel: z.array(z.string().nonempty()),
    timeFrom: z.number().nonnegative(),
    timeTo: z.number().nonnegative(),
    sortBy: sSortOptions,
  })
  .partial();

export const sMediaSearchMatch = z.object({
  relevance: z.number(),
  providerAssignedRef: z.string(),
  foreignRef: z.string(),
  provider: z.string(),
  probability: z.number(),
  objectKind: z.string(),
  subLabel: z.string(),
  startTime: z.number(),
  endTime: z.number().nullable(),
});

export const sMediaSearchResponse = z.array(sMediaSearchMatch);

export type MediaSearchArgs = z.infer<typeof sMediaSearchArgs>;
export type MediaSearchMatch = z.infer<typeof sMediaSearchMatch>;
export type MediaSearchResponse = z.infer<typeof sMediaSearchResponse>;

// -- Scene Preview Clip

export const QUERY_SCENE_PREVIEW_CLIP = 'cctv:scene-preview-clip';

export const sScenePreviewClipArgs = z.object({
  providerAssignedRef: z.string(),
});

export const sScenePreviewClipResponse = sFileResponse;

export type ScenePreviewClipArgs = z.infer<typeof sScenePreviewClipArgs>;

export type ScenePreviewClipResponse = z.infer<
  typeof sScenePreviewClipResponse
>;

// -- Object Snapshot

export const QUERY_OBJECT_SNAPSHOT = 'cctv:object-snapshot';

export const sObjectSnapshotArgs = z.object({
  providerAssignedRef: z.string(),
  height: z.number().optional(),
  quality: z.number().optional(),
  crop: z.boolean(),
  boxes: z.boolean(),
});

export const sObjectSnapshotResponse = sFileResponse;

export type ObjectSnapshotArgs = z.infer<typeof sObjectSnapshotArgs>;

export type ObjectSnapshotResponse = z.infer<typeof sObjectSnapshotResponse>;

// -- Object Thumbnail

export const QUERY_OBJECT_THUMBNAIL = 'cctv:object-thumbnail';

export const sObjectThumbnailArgs = z.object({
  providerAssignedRef: z.string(),
});

export const sObjectThumbnailResponse = sFileResponse;

export type ObjectThumbnailArgs = z.infer<typeof sObjectThumbnailArgs>;

export type ObjectThumbnailResponse = z.infer<typeof sObjectThumbnailResponse>;

// -- Object Labels

export const QUERY_OBJECT_LABELS = 'cctv:object-labels';

// (No args or response schema defined for this query in the provided code)

export const sObjectLabelsArgs = z.object({});

export type ObjectLabelsArgs = z.infer<typeof sObjectLabelsArgs>;

export const sObjectLabelResponse = z.array(z.string());

export type ObjectLabelsResponse = z.infer<typeof sObjectLabelResponse>;

// -- Faces (Gets list of recognized and un recognized faces in the media library, grouped by person)

export const QUERY_MEDIA_FACES = 'cctv:media-faces';

export const sMediaFacesArgs = z.object({});

export type MediaFacesArgs = z.infer<typeof sMediaFacesArgs>;

export const sMediaFacesResponse = z.record(z.string(), z.array(z.string()));

export type MediaFacesResponse = z.infer<typeof sMediaFacesResponse>;

// -- Face People (Gets list of people (ids) who are registered in the face recognition system)

export const QUERY_MEDIA_FACE_PEOPLE = 'cctv:media-face-people';

export const sMediaFacePeopleArgs = z.object({});

export type MediaFacePeopleArgs = z.infer<typeof sMediaFacePeopleArgs>;

export const sMediaFacePeopleResponse = z.array(z.string());

export type MediaFacePeopleResponse = z.infer<typeof sMediaFacePeopleResponse>;

// -- Media Face Person Create

export const QUERY_MEDIA_FACE_PERSON_CREATE = 'cctv:media-face-person-create';

export const sMediaFacePersonCreateArgs = z.object({
  id: z.string().nonempty(),
});

export type MediaFacePersonCreateArgs = z.infer<
  typeof sMediaFacePersonCreateArgs
>;

export const sMediaFacePersonCreateResponse = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type MediaFacePersonCreateResponse = z.infer<
  typeof sMediaFacePersonCreateResponse
>;

// -- Media Face Person Delete

export const QUERY_MEDIA_FACE_PERSON_DELETE = 'cctv:media-face-person-delete';

export const sMediaFacePersonDeleteArgs = z.object({
  id: z.string().nonempty(),
});

export type MediaFacePersonDeleteArgs = z.infer<
  typeof sMediaFacePersonDeleteArgs
>;

export const sMediaFacePersonDeleteResponse = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type MediaFacePersonDeleteResponse = z.infer<
  typeof sMediaFacePersonDeleteResponse
>;

// -- Media Face Person Add

export const QUERY_MEDIA_FACE_PERSON_ADD = 'cctv:media-face-person-add';

export const sMediaFacePersonAddArgs = z.object({
  id: z.string().nonempty(),
  image: z.string().nonempty(),
});

export type MediaFacePersonAddArgs = z.infer<typeof sMediaFacePersonAddArgs>;

export const sMediaFacePersonAddResponse = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type MediaFacePersonAddResponse = z.infer<
  typeof sMediaFacePersonAddResponse
>;

// -- Media Face Person Remove

export const QUERY_MEDIA_FACE_PERSON_REMOVE = 'cctv:media-face-person-remove';

export const sMediaFacePersonRemoveArgs = z.object({
  id: z.string().nonempty(),
  image: z.string().nonempty(),
});

export type MediaFacePersonRemoveArgs = z.infer<
  typeof sMediaFacePersonRemoveArgs
>;

export const sMediaFacePersonRemoveResponse = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type MediaFacePersonRemoveResponse = z.infer<
  typeof sMediaFacePersonRemoveResponse
>;

// -- Media Face Image (Gets the image associated with a face in the media library)

export const QUERY_MEDIA_FACE_IMAGE = 'cctv:media-face-image';

export const sMediaFaceImageArgs = z.object({
  id: z.string().nonempty(),
  imageId: z.string().nonempty(),
});

export type MediaFaceImageArgs = z.infer<typeof sMediaFaceImageArgs>;

export const sMediaFaceImageResponse = sFileResponse;

export type MediaFaceImageResponse = z.infer<typeof sMediaFaceImageResponse>;

// -- Media Face Train (Assigns an unrecognized face in the media library to a person in the face recognition system)

export const QUERY_MEDIA_FACE_TRAIN = 'cctv:media-face-train';

export const sMediaFaceTrainArgs = z.object({
  id: z.string().nonempty(),
  imageId: z.string().nonempty(),
});

export type MediaFaceTrainArgs = z.infer<typeof sMediaFaceTrainArgs>;

export const sMediaFaceTrainResponse = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type MediaFaceTrainResponse = z.infer<typeof sMediaFaceTrainResponse>;

// SCHEMA DICTIONARIES AND TYPE MAPS

// Dictionary of request schemas by query type
export const nvrAnalyticsRequestSchemas = {
  [QUERY_MEDIA_SEARCH]: sMediaSearchArgs,
  [QUERY_SCENE_PREVIEW_CLIP]: sScenePreviewClipArgs,
  [QUERY_OBJECT_SNAPSHOT]: sObjectSnapshotArgs,
  [QUERY_OBJECT_THUMBNAIL]: sObjectThumbnailArgs,
  [QUERY_OBJECT_LABELS]: sObjectLabelsArgs,
  [QUERY_MEDIA_FACES]: sMediaFacesArgs,
  [QUERY_MEDIA_FACE_PEOPLE]: sMediaFacePeopleArgs,
  [QUERY_MEDIA_FACE_PERSON_CREATE]: sMediaFacePersonCreateArgs,
  [QUERY_MEDIA_FACE_PERSON_DELETE]: sMediaFacePersonDeleteArgs,
  [QUERY_MEDIA_FACE_PERSON_ADD]: sMediaFacePersonAddArgs,
  [QUERY_MEDIA_FACE_PERSON_REMOVE]: sMediaFacePersonRemoveArgs,
  [QUERY_MEDIA_FACE_IMAGE]: sMediaFaceImageArgs,
  [QUERY_MEDIA_FACE_TRAIN]: sMediaFaceTrainArgs,
} as const;

// Dictionary of response schemas by query type
export const nvrAnalyticsResponseSchemas = {
  [QUERY_MEDIA_SEARCH]: sMediaSearchResponse,
  [QUERY_SCENE_PREVIEW_CLIP]: sScenePreviewClipResponse,
  [QUERY_OBJECT_SNAPSHOT]: sObjectSnapshotResponse,
  [QUERY_OBJECT_THUMBNAIL]: sObjectThumbnailResponse,
  [QUERY_OBJECT_LABELS]: sObjectLabelResponse,
  [QUERY_MEDIA_FACES]: sMediaFacesResponse,
  [QUERY_MEDIA_FACE_PEOPLE]: sMediaFacePeopleResponse,
  [QUERY_MEDIA_FACE_PERSON_CREATE]: sMediaFacePersonCreateResponse,
  [QUERY_MEDIA_FACE_PERSON_DELETE]: sMediaFacePersonDeleteResponse,
  [QUERY_MEDIA_FACE_PERSON_ADD]: sMediaFacePersonAddResponse,
  [QUERY_MEDIA_FACE_PERSON_REMOVE]: sMediaFacePersonRemoveResponse,
  [QUERY_MEDIA_FACE_IMAGE]: sMediaFaceImageResponse,
  [QUERY_MEDIA_FACE_TRAIN]: sMediaFaceTrainResponse,
} as const;

// TypeScript mapping types for requests and responses
export type NvrAnalyticsQueryRequestMap = {
  [QUERY_MEDIA_SEARCH]: MediaSearchArgs;
  [QUERY_SCENE_PREVIEW_CLIP]: ScenePreviewClipArgs;
  [QUERY_OBJECT_SNAPSHOT]: ObjectSnapshotArgs;
  [QUERY_OBJECT_THUMBNAIL]: ObjectThumbnailArgs;
  [QUERY_OBJECT_LABELS]: ObjectLabelsArgs;
  [QUERY_MEDIA_FACES]: MediaFacesArgs;
  [QUERY_MEDIA_FACE_PEOPLE]: MediaFacePeopleArgs;
  [QUERY_MEDIA_FACE_PERSON_CREATE]: MediaFacePersonCreateArgs;
  [QUERY_MEDIA_FACE_PERSON_DELETE]: MediaFacePersonDeleteArgs;
  [QUERY_MEDIA_FACE_PERSON_ADD]: MediaFacePersonAddArgs;
  [QUERY_MEDIA_FACE_PERSON_REMOVE]: MediaFacePersonRemoveArgs;
  [QUERY_MEDIA_FACE_IMAGE]: MediaFaceImageArgs;
  [QUERY_MEDIA_FACE_TRAIN]: MediaFaceTrainArgs;
};

export type NvrAnalyticsQueryResponseMap = {
  [QUERY_MEDIA_SEARCH]: MediaSearchResponse;
  [QUERY_SCENE_PREVIEW_CLIP]: ScenePreviewClipResponse;
  [QUERY_OBJECT_SNAPSHOT]: ObjectSnapshotResponse;
  [QUERY_OBJECT_THUMBNAIL]: ObjectThumbnailResponse;
  [QUERY_OBJECT_LABELS]: ObjectLabelsResponse;
  [QUERY_MEDIA_FACES]: MediaFacesResponse;
  [QUERY_MEDIA_FACE_PEOPLE]: MediaFacePeopleResponse;
  [QUERY_MEDIA_FACE_PERSON_CREATE]: MediaFacePersonCreateResponse;
  [QUERY_MEDIA_FACE_PERSON_DELETE]: MediaFacePersonDeleteResponse;
  [QUERY_MEDIA_FACE_PERSON_ADD]: MediaFacePersonAddResponse;
  [QUERY_MEDIA_FACE_PERSON_REMOVE]: MediaFacePersonRemoveResponse;
  [QUERY_MEDIA_FACE_IMAGE]: MediaFaceImageResponse;
  [QUERY_MEDIA_FACE_TRAIN]: MediaFaceTrainResponse;
};
