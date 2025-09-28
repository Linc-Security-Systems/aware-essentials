import { sForeignDeviceInfo } from '../device';
import { sCredentialType } from '../access-control/credential';
import { z } from 'zod';
import {
  sCreateAccessRuleRequest,
  sCreatePersonRequest,
  sCreateScheduleRequest,
  sCreateZoneRequest,
} from '../access-control';

// PROTOCOL ENVELOPE

export const sMessageHeader = z.object({
  version: z.number().describe('Protocol version'),
  id: z.string().nonempty('ID is required').describe('Unique message ID'),
  from: z
    .string()
    .nonempty('Agent name required')
    .describe("Sender ID (Agent ID or 'server')"),
  on: z.number().describe('Timestamp in milliseconds since epoch'),
});

export const sMessageWithPayload = <T extends z.ZodRawShape>(
  sPayload: z.ZodObject<T>,
) => sMessageHeader.and(sPayload).describe('Message with payload');

export const sResponsePayload = <TKind, T extends z.ZodRawShape>(
  kind: z.ZodLiteral<TKind>,
  sPayload: z.ZodObject<T>,
) =>
  // success branch
  z.object({ requestId: z.string().nonempty(), kind }).and(sPayload);

export const sErrorPayload = sResponsePayload(
  z.literal('error-rs'),
  z.object({
    error: z.string().nonempty().describe('Error message if request failed'),
  }),
);

// REGISTER

export const sUiOrderHint = z.object({
  kind: z.literal('order'),
  path: z.string(),
  fields: z.array(z.string().nonempty()),
});

export const sUiWidgetHint = z.object({
  kind: z.literal('widget'),
  path: z.string(),
  spanColumns: z.number().optional(),
  password: z.boolean().optional(),
  placeHolder: z.string().optional(),
});

export const sUiHint = z.union([sUiOrderHint, sUiWidgetHint]);

export const sProviderSpecs = z.object({
  title: z
    .string()
    .nonempty()
    .describe('a human-readable name for the provider'),
  configSchema: z
    .unknown()
    .describe(
      'a valid JSON schema that describes provider config data structure',
    ), // We can use AJV to validate the definition of a JSON schema
  configDefault: z
    .record(z.unknown())
    .describe('Default initialized values for configuration'),
  configFormUiHints: z
    .array(sUiHint)
    .optional()
    .describe('UI hints for configuration form visuals'),
});

export const sAccessObjectKind = z.enum([
  'accessRule',
  'schedule',
  'person',
  'device',
  'zone',
]);

export const sTokenSpecs = z.object({
  type: sCredentialType, // etc, those map to a AWARE-standardized set of token types
  regex: z.string().optional(),
  formatDescription: z.string().optional(),
  maxPerPerson: z.number().optional(),
});

export const sAccessControlCapabilityReport = z.object({
  tokens: z.array(sTokenSpecs),
  accessObjects: z.array(sAccessObjectKind),
  oneSchedulePerDoor: z.boolean(),
});

export const sAccessControlProfile = sAccessControlCapabilityReport;

export const sVisionProfile = z.object({});

export const sServices = z.object({
  accessControl: sAccessControlProfile,
  vision: sVisionProfile,
});

export type AgentServices = z.infer<typeof sServices>;

export const sRegisterRq = z.object({
  kind: z.literal('register'),
  provider: z.string().nonempty(),
  metadata: sProviderSpecs,
  services: sServices.partial().describe('Services supported by the provider'),
});

export const sRegisterRs = sResponsePayload(
  z.literal('register-rs'),
  z.object({}),
);

// UNREGISTER

export const sUnregister = z
  .object({
    kind: z.literal('unregister'),
    provider: z.string().nonempty(),
  })
  .describe('Request to unregister a provider');

// VALIDATE PROVIDER CONFIG

export const sValidateProviderConfigRq = z.object({
  kind: z.literal('validate-config'),
  provider: z.string().nonempty(),
  config: z.record(z.unknown()),
});

export const sConfigurationIssue = z
  .object({
    paths: z.array(z.string()),
    message: z.string(),
  })
  .describe('A configuration issue that can be reported by agents');

export const sValidateProviderConfigRs = sResponsePayload(
  z.literal('validate-config-rs'),
  z.object({
    issues: z.array(sConfigurationIssue),
  }),
).describe('Validation result for provider configuration');

// START SERVICE

export const sStartServiceRq = z
  .object({
    kind: z.literal('start'),
    provider: z.string().nonempty(),
    config: z.record(z.unknown()),
    lastEventForeignRef: z
      .string()
      .nullable()
      .describe(
        'Last event foreign reference that the agent should start from',
      ),
    lastEventTimestamp: z
      .number()
      .nullable()
      .describe('Last event timestamp that the agent should start from'),
  })
  .describe('Request to start a service for a provider');

export const sStartServiceRs = sResponsePayload(
  z.literal('start-rs'),
  z.object({}),
).describe('Response for starting a service for a provider');

// STOP SERVICE

export const sStopServiceRq = z
  .object({
    kind: z.literal('stop'),
    provider: z.string().nonempty(),
  })
  .describe('Request to stop a service for a provider');

export const sStopServiceRs = sResponsePayload(
  z.literal('stop-rs'),
  z.object({}),
).describe('Response for starting a service for a provider');

// RUN COMMAND

export const sRunCommandRq = z
  .object({
    kind: z.literal('command'),
    device: sForeignDeviceInfo,
    command: z.string().nonempty(),
    batchId: z
      .string()
      .optional()
      .describe('Batch ID for the command of the command was part of a macro'),
    params: z.record(z.unknown()).optional(),
  })
  .describe('Request to run a device command');

export const sRunCommandRs = sResponsePayload(
  z.literal('command-rs'),
  z.object({}),
).describe('Response for running a device command');

// PUSH DEVICE STATE UPDATE

export const sPushStateUpdateRq = z
  .object({
    kind: z.literal('state'),
    foreignRef: z.string().nonempty(),
    provider: z.string().nonempty(),
    mergeProps: z.record(z.unknown()),
    removeProps: z.array(z.string().nonempty()),
  })
  .describe('Request to push a device state update');

export const sPushStateUpdateRs = sResponsePayload(
  z.literal('state-rs'),
  z.object({}),
).describe('Response for pushing a device state update');

// PUSH DEVICE EVENT

export const sPushEventRq = z
  .object({
    kind: z.literal('event'),
    foreignRef: z.string().nonempty(),
    provider: z.string().nonempty(),
    eventTimestamp: z
      .number()
      .describe(
        'Event timestamp in milliseconds since epoch, as reported by origin',
      ),
    eventForeignRef: z.string().nonempty(),
    event: z.unknown().describe('Event data'),
  })
  .describe('Request to push a device event');

export const sPushEventRs = sResponsePayload(
  z.literal('event-rs'),
  z.object({}),
).describe('Response for pushing a device event');

// QUERIES

export const sQuery = z.object({
  kind: z.literal('query'),
  query: z.string().nonempty(),
  args: z.unknown().describe('Query arguments, depends on the query type'),
  replyUrl: z.string().nonempty().describe('URL to POST the query response to'),
});

export const sQueryRs = sResponsePayload(
  z.literal('query-rs'),
  z.object({
    result: z.unknown().describe('Query result, depends on the query type'),
  }),
).describe('Response for a query');

// ACCESS SYNC SECTION

// ————————————————————————————————————————————————————
// Merge (insert vs update) variants, all listed explicitly
// ————————————————————————————————————————————————————
export const sObjectMerge = z
  .union([
    // accessRule insert
    z.object({
      kind: z.literal('merge'),
      objectId: z.string().nonempty().describe('Object ID as in backend'),
      objectKind: z.literal('accessRule'),
      original: z.null(),
      props: sCreateAccessRuleRequest,
    }),
    // accessRule update
    z.object({
      kind: z.literal('merge'),
      objectId: z.string().nonempty().describe('Object ID as in backend'),
      objectKind: z.literal('accessRule'),
      original: sCreateAccessRuleRequest,
      props: sCreateAccessRuleRequest.partial(),
    }),

    // schedule insert
    z.object({
      kind: z.literal('merge'),
      objectId: z.string().nonempty().describe('Object ID as in backend'),
      objectKind: z.literal('schedule'),
      original: z.null(),
      props: sCreateScheduleRequest,
    }),
    // schedule update
    z.object({
      kind: z.literal('merge'),
      objectId: z.string().nonempty().describe('Object ID as in backend'),
      objectKind: z.literal('schedule'),
      original: sCreateScheduleRequest,
      props: sCreateScheduleRequest.partial(),
    }),

    // person insert
    z.object({
      kind: z.literal('merge'),
      objectId: z.string().nonempty().describe('Object ID as in backend'),
      objectKind: z.literal('person'),
      original: z.null(),
      props: sCreatePersonRequest,
    }),
    // person update
    z.object({
      kind: z.literal('merge'),
      objectId: z.string().nonempty().describe('Object ID as in backend'),
      objectKind: z.literal('person'),
      original: sCreatePersonRequest,
      props: sCreatePersonRequest.partial(),
    }),

    // zone insert
    z.object({
      kind: z.literal('merge'),
      objectId: z.string().nonempty().describe('Object ID as in backend'),
      objectKind: z.literal('zone'),
      original: z.null(),
      props: sCreateZoneRequest,
    }),
    // zone update
    z.object({
      kind: z.literal('merge'),
      objectId: z.string().nonempty().describe('Object ID as in backend'),
      objectKind: z.literal('zone'),
      original: sCreateZoneRequest,
      props: sCreateZoneRequest.partial(),
    }),
  ])
  .describe('Object merge request');

// ————————————————————————————————————————————————————
// Delete variants, also fully expanded
// ————————————————————————————————————————————————————
export const sObjectDelete = z
  .union([
    z.object({
      kind: z.literal('delete'),
      objectId: z.string().nonempty().describe('Object ID as in backend'),
      objectKind: z.literal('accessRule'),
      original: sCreateAccessRuleRequest,
    }),
    z.object({
      kind: z.literal('delete'),
      objectId: z.string().nonempty().describe('Object ID as in backend'),
      objectKind: z.literal('schedule'),
      original: sCreateScheduleRequest,
    }),
    z.object({
      kind: z.literal('delete'),
      objectId: z.string().nonempty().describe('Object ID as in backend'),
      objectKind: z.literal('person'),
      original: sCreatePersonRequest,
    }),
    z.object({
      kind: z.literal('delete'),
      objectId: z.string().nonempty().describe('Object ID as in backend'),
      objectKind: z.literal('zone'),
      original: sCreateZoneRequest,
    }),
  ])
  .describe('Object delete request');

export const sAccessMutation = z
  .union([sObjectMerge, sObjectDelete])
  .describe('Access object change description');

export const sDeviceMap = z
  .record(z.record(z.unknown()))
  .describe('Map of devices (readers) and their stashed provider metadata');

export const sRefMap = z
  .record(z.record(z.array(z.string().nonempty())))
  .describe('Map of foreign references to object IDs');

// A. VALIDATE ACCESS CHANGES

export const sValidateChangeRq = z
  .object({
    kind: z.literal('validate-change'),
    provider: z.string().nonempty(),
    devices: sDeviceMap,
    refMap: sRefMap,
    mutations: z.array(sAccessMutation),
  })
  .describe('Request to validate access changes');

export const sChangeIssueCode = z.enum([
  'BAD_REFERENCE',
  'NOT_FOUND',
  'NOT_UNIQUE',
  'INVALID',
  'NOT_SUPPORTED',
]);

export const sChangeIssue = z
  .object({
    objectId: z.string().optional().describe('Object ID as in backend'),
    objectKind: sAccessObjectKind.optional(),
    code: sChangeIssueCode
      .optional()
      .describe('Issue code that describes the issue to UI agent(s) or bots'),
    path: z
      .string()
      .optional()
      .describe(
        'Path - inside object referenced by ObjectID, points to a field or a related object',
      ),
    index: z
      .number()
      .optional()
      .describe('Index ofa value in field pointed at by path'),
    message: z
      .string()
      .optional()
      .describe(
        'Message that describes the issue to user or the details of what went wrong',
      ),
  })
  .describe('Access change issue description');

export const sValidateChangeRs = sResponsePayload(
  z.literal('validate-change-rs'),
  z.object({
    issues: z.array(sChangeIssue),
  }),
).describe('Response for validating access changes');

// B. APPLY ACCESS CHANGES

export const sApplyChange = z
  .object({
    kind: z.literal('apply-change'),
    provider: z.string().nonempty(),
    devices: sDeviceMap,
    refMap: sRefMap,
    mutations: z.array(sAccessMutation),
  })
  .describe('Request to apply access changes');

export const sApplyChangeRs = sResponsePayload(
  z.literal('apply-change-rs'),
  z.object({
    requestId: z.string().nonempty(),
    //error: z.string().optional().describe('Error message if request failed'),
    refs: sRefMap,
  }),
).describe('Response for applying access changes');

export const sApplyChangeProgress = z
  .object({
    kind: z.literal('apply-change-progress'),
    requestId: z.string().nonempty(),
    mutationIndex: z
      .number()
      .describe('Index of the finished mutation in the batch'),
    // total: z.number().describe('Progress of the access changes'),
    // completed: z.number().describe('Progress of the access changes'),
  })
  .describe('Progress of the access changes');

// C. ABORT CHANGES

export const sAbortChange = z
  .object({
    kind: z.literal('abort-change'),
    provider: z.string().nonempty(),
    policyVersion: z.number().describe('Version of the access changes'),
  })
  .describe('Request to abort access changes');

// TYPESCRIPT INFERRED TYPES

export type MessageHeader = z.infer<typeof sMessageHeader>;
export type Message<TPayload> = MessageHeader & TPayload;
export type ErrorPayload = z.infer<typeof sErrorPayload>;
export type RegisterRq = z.infer<typeof sRegisterRq>;
export type RegisterRs = z.infer<typeof sRegisterRs>;
export type Unregister = z.infer<typeof sUnregister>;
export type ValidateProviderConfigRq = z.infer<
  typeof sValidateProviderConfigRq
>;
export type ValidateProviderConfigRs = z.infer<
  typeof sValidateProviderConfigRs
>;
export type StartServiceRq = z.infer<typeof sStartServiceRq>;
export type StartServiceRs = z.infer<typeof sStartServiceRs>;
export type StopServiceRq = z.infer<typeof sStopServiceRq>;
export type StopServiceRs = z.infer<typeof sStopServiceRs>;
export type RunCommandRq = z.infer<typeof sRunCommandRq>;
export type RunCommandRs = z.infer<typeof sRunCommandRs>;
export type PushStateUpdateRq = z.infer<typeof sPushStateUpdateRq>;
export type PushStateUpdateRs = z.infer<typeof sPushStateUpdateRs>;
export type PushEventRq = z.infer<typeof sPushEventRq>;
export type PushEventRs = z.infer<typeof sPushEventRs>;
export type QueryRq = z.infer<typeof sQuery>;
export type QueryRs = z.infer<typeof sQueryRs>;
// export type GetAvailableDevicesRq = z.infer<typeof sGetAvailableDevicesRq>;
// export type GetAvailableDevicesRs = z.infer<typeof sGetAvailableDevicesRs>;
export type AccessMutation = z.infer<typeof sAccessMutation>;
export type AccessValidateChangeRq = z.infer<typeof sValidateChangeRq>;
export type AccessValidateChangeRs = z.infer<typeof sValidateChangeRs>;
export type AccessChangeIssue = z.infer<typeof sChangeIssue>;
export type AccessApplyChange = z.infer<typeof sApplyChange>;
export type AccessApplyChangeRs = z.infer<typeof sApplyChangeRs>;
export type AccessApplyChangeProgress = z.infer<typeof sApplyChangeProgress>;
export type AccessAbortChange = z.infer<typeof sAbortChange>;
export type AccessControlCapabilityReport = z.infer<
  typeof sAccessControlCapabilityReport
>;
export type AccessTokenSpecs = z.infer<typeof sTokenSpecs>;
export type AccessObjectKind = z.infer<typeof sAccessObjectKind>;
export type UiHint = z.infer<typeof sUiHint>;
export type UiOrderHint = z.infer<typeof sUiOrderHint>;
export type UiWidgetHint = z.infer<typeof sUiWidgetHint>;
export type ProviderSpecs = z.infer<typeof sProviderSpecs>;
export type ConfigurationIssue = z.infer<typeof sConfigurationIssue>;

export type AccessRefMap = z.infer<typeof sRefMap>;

export type PayloadByKind = {
  register: RegisterRq;
  'register-rs': RegisterRs;
  unregister: Unregister;
  'validate-config': ValidateProviderConfigRq;
  'validate-config-rs': ValidateProviderConfigRs;
  start: StartServiceRq;
  'start-rs': StartServiceRs;
  stop: StopServiceRq;
  'stop-rs': StopServiceRs;
  command: RunCommandRq;
  'command-rs': RunCommandRs;
  state: PushStateUpdateRq;
  'state-rs': PushStateUpdateRs;
  event: PushEventRq;
  'event-rs': PushEventRs;
  query: QueryRq;
  'query-rs': QueryRs;
  // 'get-available-devices': GetAvailableDevicesRq;
  // 'get-available-devices-rs': GetAvailableDevicesRs;
  'validate-change': AccessValidateChangeRq;
  'validate-change-rs': AccessValidateChangeRs;
  'apply-change': AccessApplyChange;
  'apply-change-rs': AccessApplyChangeRs;
  'apply-change-progress': AccessApplyChangeProgress;
  'abort-change': AccessAbortChange;
  'error-rs': ErrorPayload;
};

export type FromAgent =
  | ErrorPayload
  | QueryRs
  | RegisterRq
  | Unregister
  | ValidateProviderConfigRs
  | StartServiceRs
  | StopServiceRs
  | RunCommandRs
  | PushStateUpdateRq
  | PushEventRq
  | AccessValidateChangeRs
  | AccessApplyChangeRs
  | AccessApplyChangeProgress;

export type FromServer =
  | ErrorPayload
  | RegisterRs
  | ValidateProviderConfigRq
  | StartServiceRq
  | StopServiceRq
  | QueryRq
  | RunCommandRq
  | PushStateUpdateRs
  | PushEventRs
  | AccessValidateChangeRq
  | AccessApplyChange
  | AccessAbortChange;

export type AnyPayload = FromAgent | FromServer;

const fromAgentSchemaByKind = {
  register: sRegisterRq,
  unregister: sUnregister,
  'validate-config-rs': sValidateProviderConfigRs,
  'start-rs': sStartServiceRs,
  'stop-rs': sStopServiceRs,
  'command-rs': sRunCommandRs,
  state: sPushStateUpdateRq,
  event: sPushEventRq,
  'validate-change-rs': sValidateChangeRs,
  'apply-change-rs': sApplyChangeRs,
  'apply-change-progress': sApplyChangeProgress,
  'error-rs': sErrorPayload,
  'query-rs': sQueryRs,
};

export const getAgentMessageIssues = (message: unknown): string[] => {
  const result = sMessageHeader.safeParse(message);
  if (!result.success) {
    return result.error.errors.map(
      (e) => `${e.path.map((p) => p.toString()).join('.')} - ${e.message}`,
    );
  }
  const { kind } = message as { kind: string };
  const schema =
    fromAgentSchemaByKind[kind as keyof typeof fromAgentSchemaByKind];
  if (!schema) {
    return [`Unknown message kind: ${kind}`];
  }
  const result2 = schema.safeParse(message);
  if (!result2.success) {
    return result2.error.errors.map((e) => e.message);
  }
  return [];
};

export const isMessageFromAgent = (
  message: unknown,
): message is Message<FromAgent> => {
  if (typeof message !== 'object' || message === null) {
    return false;
  }

  const headerResult = sMessageHeader.safeParse(message);
  if (!headerResult.success) {
    return false;
  }

  const { kind } = message as { kind: string };
  const schema =
    fromAgentSchemaByKind[kind as keyof typeof fromAgentSchemaByKind];

  if (!schema) {
    return false;
  }

  const result = schema.safeParse(message);
  return result.success;
};
