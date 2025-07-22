import { z } from 'zod';

// MQTT Payloads for agent communication
export const sMqttInboundStateUpdate = z.object({
  timestamp: z.number(),
  mergeProps: z.record(z.string(), z.unknown()),
  removeProps: z.array(z.string().nonempty()).optional(),
});

export const sMqttInboundEvent = z.object({
  eventTimestamp: z
    .number()
    .describe(
      'Event timestamp in milliseconds since epoch, as reported by origin',
    ),
  eventForeignRef: z.string().nonempty(),
  event: z.unknown().describe('Event data'),
});

export type MqttInboundStateUpdate = z.infer<typeof sMqttInboundStateUpdate>;
export type MqttInboundEvent = z.infer<typeof sMqttInboundEvent>;
