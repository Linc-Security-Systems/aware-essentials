import { Scenario, scenarioPass } from "../../scenario.types";

const s: Scenario = {
  tags: ["doors"],
  name: "Doors: Doors lock and unlock correctly",
  description: "Doors: Doors lock and unlock correctly",
  run: async (ctx) => {
    // Start the provider first
    await ctx.getReply({
      kind: "start",
      provider: ctx.provider,
      config: ctx.config,
      lastEventForeignRef: null,
      lastEventTimestamp: null,
    });

    // Request available devices
    const devicesResponse = await ctx.getReply({
      kind: "get-available-devices",
      provider: ctx.provider,
    });

    // get all found doors
    const doors = devicesResponse.devices.filter((d) => d.type === "door");
    const doorRefs = doors.map((d) => d.foreignRef);

    ctx.log(`Found ${doors.length} doors`);

    // Wait for agent to report initial state with connectivity info
    const states = await ctx.deviceState.waitForDevices(
      doorRefs,
      (state) => "connected" in state,
      30000,
    );

    // Filter to doors the agent reports as connected
    const connectedDoors = doors.filter((door) => {
      const state = states.get(door.foreignRef);
      return state && state.connected === true;
    });

    ctx.log(`Found ${connectedDoors.length} connected doors`);

    if (connectedDoors.length === 0) {
      throw new Error("No connected doors found, cannot proceed with test");
    }

    // unlock all doors in parallel
    await Promise.all(
      connectedDoors.map((door) =>
        ctx.getReply({
          kind: "command",
          device: { ...door, presets: [] },
          command: "door.unlock",
          params: {},
        }),
      ),
    );

    ctx.log(`Sent unlock command to ${connectedDoors.length} connected doors`);

    const connectedRefs = connectedDoors.map((d) => d.foreignRef);
    await ctx.deviceState.waitForDevices(
      connectedRefs,
      (state) => state.locked === false,
      30000,
    );

    ctx.log(`All ${connectedDoors.length} doors are now unlocked`);

    // lock all doors in parallel

    await Promise.all(
      connectedDoors.map((door) =>
        ctx.getReply({
          kind: "command",
          device: { ...door, presets: [] },
          command: "door.lock",
          params: {},
        }),
      ),
    );

    ctx.log(`Sent lock command to ${connectedDoors.length} connected doors`);

    await ctx.deviceState.waitForDevices(
      connectedRefs,
      (state) => state.locked === true,
      30000,
    );

    ctx.log(`All ${connectedDoors.length} doors are now locked`);

    // Stop the provider
    await ctx.getReply({
      kind: "stop",
      provider: ctx.provider,
    });

    return scenarioPass();
  },
};

export default s;
