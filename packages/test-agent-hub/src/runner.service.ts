import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  FromAgent,
  FromServer,
  Message,
} from '@awarevue/api-types';
import { AgentProtocol, RequestKind, Outbound } from '@awarevue/agent-sdk';
import { filter, firstValueFrom, take, timeout, map, lastValueFrom } from 'rxjs';
import { HubService, ConnectedAgent } from './hub.service';
import { CLI_OPTIONS, CLIOptions } from './cli-options';
import {
  loadScenarios,
  filterScenarios,
  ScenarioContext,
  ScenarioResult,
  scenarioFail,
} from './scenarios';
import {
  ScenarioReport,
  printConsoleReport,
  writeJUnitReport,
} from './reporter';

@Injectable()
export class RunnerService {
  private readonly logger = new Logger(RunnerService.name);

  constructor(
    private readonly hubService: HubService,
    @Inject(CLI_OPTIONS) private readonly options: CLIOptions,
  ) {}

  /**
   * Main entry point. Connects to agent, runs scenarios, reports results.
   * Returns process exit code (0 = all pass, 1 = any failure).
   */
  async run(): Promise<number> {
    const { agentId, tags, timeout: scenarioTimeout, connectionTimeout, report } = this.options;

    // 1. Wait for agent to connect
    let agent: ConnectedAgent;
    try {
      agent = await this.hubService.awaitAgent(agentId, connectionTimeout);
    } catch (err) {
      this.logger.error((err as Error).message);
      return 1;
    }

    // 2. Load & filter scenarios
    const allScenarios = loadScenarios();
    const scenarios = filterScenarios(allScenarios, tags);

    this.logger.log(
      `Agent: ${agentId} | Scenarios: ${scenarios.length}/${allScenarios.length}` +
        (tags.length > 0 ? ` | Tags: ${tags.join(', ')}` : ' | Tags: (all)'),
    );

    if (scenarios.length === 0) {
      this.logger.warn('No scenarios matched the given tags');
      return 0;
    }

    // 3. Pick first provider from the agent's registration
    const providers = Object.keys(agent.registerPayload.providers);
    if (providers.length === 0) {
      this.logger.error('Agent registered with no providers');
      return 1;
    }
    const provider = providers[0];
    const providerSpecs = agent.registerPayload.providers[provider];
    // Use CLI-provided config, fall back to provider's configDefault
    const config = this.options.providerConfig
      ?? (providerSpecs.configDefault as Record<string, unknown>)
      ?? {};

    // 4. Run each scenario sequentially
    const reports: ScenarioReport[] = [];

    for (const scenario of scenarios) {
      const logs: string[] = [];
      const start = Date.now();

      let result: ScenarioResult;

      try {
        // Build the context for this scenario
        const ctx = this.buildContext(
          agent,
          provider,
          config,
          logs,
          scenarioTimeout,
        );

        // Run with timeout
        result = await this.runWithTimeout(
          scenario.run(ctx),
          scenarioTimeout,
          start,
        );
      } catch (err) {
        const elapsed = Date.now() - start;
        result = {
          ...scenarioFail((err as Error).message),
          durationMs: elapsed,
        };
      }

      reports.push({ name: scenario.name, result, logs });
    }

    // 5. Print console report
    printConsoleReport(reports);

    // 6. Write JUnit XML if requested
    if (report) {
      writeJUnitReport(reports, report);
      this.logger.log(`JUnit report written to ${report}`);
    }

    // 7. Cleanup
    this.hubService.close();

    // 8. Return exit code
    const failed = reports.filter((r) => !r.result.passed).length;
    return failed > 0 ? 1 : 0;
  }

  private buildContext(
    agent: ConnectedAgent,
    provider: string,
    config: Record<string, unknown>,
    logs: string[],
    timeoutMs: number,
  ): ScenarioContext {
    const { protocol, registerPayload } = agent;

    return {
      protocol,
      registerPayload,
      provider,
      config,
      log: (msg: string) => logs.push(msg),

      getReply: <K extends RequestKind>(
        payload: Extract<Outbound<'server'>, { kind: K }>,
      ) => {
        return lastValueFrom(protocol.getReply$(payload));
      },

      waitForMessage: (
        predicate: (msg: Message<FromAgent>) => boolean,
        customTimeout?: number,
      ): Promise<Message<FromAgent>> => {
        return firstValueFrom(
          (protocol as any).transport.messages$.pipe(
            filter((msg: Message<FromAgent>) => predicate(msg)),
            take(1),
            timeout(customTimeout ?? timeoutMs),
          ),
        );
      },

      waitForKind: <K extends FromAgent['kind']>(
        kind: K,
        customTimeout?: number,
      ): Promise<Message<Extract<FromAgent, { kind: K }>>> => {
        return firstValueFrom(
          (protocol as any).transport.messages$.pipe(
            filter((msg: Message<FromAgent>) => msg.kind === kind),
            take(1),
            timeout(customTimeout ?? timeoutMs),
            map(
              (msg: Message<FromAgent>) =>
                msg as Message<Extract<FromAgent, { kind: K }>>,
            ),
          ),
        );
      },
    };
  }

  private async runWithTimeout(
    promise: Promise<Omit<ScenarioResult, 'durationMs'>>,
    timeoutMs: number,
    startTime: number,
  ): Promise<ScenarioResult> {
    return new Promise<ScenarioResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        resolve({
          passed: false,
          errors: [`Scenario timed out after ${timeoutMs}ms`],
          durationMs: Date.now() - startTime,
        });
      }, timeoutMs);

      promise
        .then((partial) => {
          clearTimeout(timer);
          resolve({
            ...partial,
            durationMs: Date.now() - startTime,
          });
        })
        .catch((err) => {
          clearTimeout(timer);
          resolve({
            passed: false,
            errors: [(err as Error).message],
            durationMs: Date.now() - startTime,
          });
        });
    });
  }
}
