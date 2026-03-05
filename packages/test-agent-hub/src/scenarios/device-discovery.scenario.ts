import { Scenario, scenarioPass, scenarioFail } from './scenario.types';

/**
 * After starting the agent, sends `get-available-devices` and validates
 * that the response has the expected structure.
 */
const scenario: Scenario = {
  name: 'device-discovery',
  description:
    'Starts the agent and requests available devices, validates the response',
  tags: ['core', 'devices'],

  async run(ctx) {
    const { provider, config } = ctx;

    // Start the provider first
    
    await ctx.getReply({
      kind: 'start',
      provider,
      config,
      lastEventForeignRef: null,
      lastEventTimestamp: null,
    });

    ctx.log('Provider started');

    // Request available devices
    const devicesResponse = await ctx.getReply({
      kind: 'get-available-devices',
      provider,
    });

    ctx.log(
      `Received device discovery response (kind: ${devicesResponse.kind})`,
    );

    // Validate response has expected fields
    const errors: string[] = [];

    if (devicesResponse.kind !== 'get-available-devices-rs') {
      errors.push(
        `Expected kind 'get-available-devices-rs', got '${devicesResponse.kind}'`,
      );
    }

    // Stop the provider
    try {
      await ctx.getReply({
        kind: 'stop',
        provider,
      });
    } catch {
      // Non-fatal — scenario result is about discovery, not stop
      ctx.log('Warning: failed to stop provider after test');
    }

    if (errors.length > 0) {
      return scenarioFail(...errors);
    }

    return scenarioPass();
  },
};

export default scenario;
