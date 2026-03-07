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
    const predicate = (msg: Message<FromAgent>) => {
      return (
        msg.kind === 'state' &&
        doors.some((door) => msg.foreignRef === door.foreignRef) &&
        'connected' in msg.mergeProps && !!msg.mergeProps.connected
      );
    }
    const matches = await ctx.waitForSomeMessages(predicate, 30000);

    const stateMessages = matches.filter((msg) => msg.kind === 'state');
    const connectedDoors = stateMessages.map((msg) => msg.foreignRef);

    for (const door of connectedDoors) {
      const device = devicesResponse.devices.find((d) => d.foreignRef === door);
      if (!device) {
        ctx.log(`Warning: received state for unknown door with foreignRef '${door}'`);
        continue;
      }
      await ctx.getReply({
        kind: 'command',
        device: { ...device, presets: [] },
        command: 'door.unlock',
        params: {},
      });
    }

    // Stop the provider
    await ctx.getReply({
      kind: 'stop',
      provider: ctx.provider,
    });

    return scenarioPass();
  },
};

export default s;
