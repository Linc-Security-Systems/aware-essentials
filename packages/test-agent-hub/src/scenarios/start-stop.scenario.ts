import { Scenario, scenarioPass, scenarioFail } from './scenario.types';

/**
 * Tests the agent's start/stop lifecycle:
 * - Sends `start`, expects `start-rs`
 * - Sends `stop`, expects `stop-rs`
 */
const scenario: Scenario = {
  name: 'start-stop',
  description: 'Sends start and stop to the agent and validates responses',
  tags: ['core', 'lifecycle'],

  async run(ctx) {
    const { provider, config } = ctx;

    // Send start, expect start-rs
    ctx.log(`Starting provider '${provider}'...`);
    try {
      await ctx.getReply({
        kind: 'start',
        provider,
        config,
        lastEventForeignRef: null,
        lastEventTimestamp: null,
      });
    } catch (err) {
      return scenarioFail(
        `Failed to start provider '${provider}': ${(err as Error).message}`,
      );
    }

    ctx.log('start-rs received');

    // Send stop, expect stop-rs
    ctx.log(`Stopping provider '${provider}'...`);
    try {
      await ctx.getReply({
        kind: 'stop',
        provider,
      });
    } catch (err) {
      return scenarioFail(
        `Failed to stop provider '${provider}': ${(err as Error).message}`,
      );
    }

    ctx.log('stop-rs received');

    return scenarioPass();
  },
};

export default scenario;
