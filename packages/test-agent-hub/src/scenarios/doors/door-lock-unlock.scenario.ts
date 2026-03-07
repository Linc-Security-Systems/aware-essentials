import { Scenario, scenarioPass } from "../../scenario.types";

const s: Scenario = {
  tags: ['doors'],
  name: 'Doors: Doors lock and unlock correctly',
  description: 'Doors: Doors lock and unlock correctly',
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
    const doorRefs = doors.map((d) => d.foreignRef);

    // Wait for agent to report initial state with connectivity info
    const states = await ctx.deviceState.waitForDevices(
      doorRefs,
      (state) => 'connected' in state,
      30000,
    );

    // Filter to doors the agent reports as connected
    const connectedDoors = doors.filter((door) => {
      const state = states.get(door.foreignRef);
      return state && state.connected === true;
    });

    for (const door of connectedDoors) {
      // Send unlock command to the agent
      await ctx.getReply({
        kind: 'command',
        device: { ...door, presets: [] },
        command: 'door.unlock',
        params: {},
      });

      // Verify the agent reports the door as unlocked
      await ctx.deviceState.assertState(
        door.foreignRef,
        (state) => state.locked === false,
        'Agent should report door as unlocked after unlock command',
      );

      // Send lock command to the agent
      await ctx.getReply({
        kind: 'command',
        device: { ...door, presets: [] },
        command: 'door.lock',
        params: {},
      });

      // Verify the agent reports the door as locked
      await ctx.deviceState.assertState(
        door.foreignRef,
        (state) => state.locked === true,
        'Agent should report door as locked after lock command',
      );
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
