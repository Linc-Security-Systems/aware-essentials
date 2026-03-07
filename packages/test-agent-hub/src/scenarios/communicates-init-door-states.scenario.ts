import { FromAgent, Message } from "@awarevue/api-types";
import { Scenario, scenarioFail, scenarioPass } from "../scenario.types";

const s: Scenario = {
  tags: ['doors'],
  name: 'Doors: Communicates initial states upon start',
  description: 'Doors: Communicates initial states upon start',
  run: async (ctx) => {
    // Start the provider first
    await ctx.getReply({
      kind: 'start',
      provider: ctx.provider,
      config: ctx.config,
      lastEventForeignRef: null,
      lastEventTimestamp: null,
    });

    // Request available devices
    const devicesResponse = await ctx.getReply({
      kind: 'get-available-devices',
      provider: ctx.provider,
    });

    // get all found doors
    const doors = devicesResponse.devices.filter(
      (d) => d.type === 'door',
    );

    // wait for a state message for each door, with a connected flag
    const predicates = doors.map((door) => (msg: Message<FromAgent>) => {
      return (
        msg.kind === 'state' &&
        msg.foreignRef === door.foreignRef && 'connected' in msg.mergeProps
      );
    });
    await ctx.waitForAllMessages(predicates, 30000);

    // Stop the provider
    await ctx.getReply({
      kind: 'stop',
      provider: ctx.provider,
    });

    return scenarioPass();
  },
};

export default s;
