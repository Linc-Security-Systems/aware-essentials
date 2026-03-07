import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  FromAgent,
  FromServer,
  Message,
} from '@awarevue/api-types';
import { RequestKind, Outbound } from '@awarevue/agent-sdk';
import { filter, firstValueFrom, take, timeout, map, lastValueFrom, scan, tap } from 'rxjs';
import { HubService, ConnectedAgent } from './hub.service';
import { CLI_OPTIONS, CLIOptions } from './cli-options';
import {
  loadScenarios,
  filterScenarios,
  ScenarioContext,
  ScenarioResult,
  scenarioFail,
} from '.';
import {
  ScenarioReport,
  printConsoleReport,
  writeJUnitReport,
} from './reporter';
import { DeviceStateStoreImpl } from './helpers/device-state-store';

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
      let store: DeviceStateStoreImpl | undefined;

      try {
        // Build the context for this scenario (fresh state store each time)
        const built = this.buildContext(
          agent,
          provider,
          config,
          logs,
          scenarioTimeout,
        );
        store = built.store;

        // Run with timeout
        this.logger.log(`Running scenario '${scenario.name}'...`);
        result = await this.runWithTimeout(
          scenario.run(built.ctx),
          scenarioTimeout,
          start,
        );
      } catch (err) {
        const elapsed = Date.now() - start;
        result = {
          ...scenarioFail((err as Error).message),
          durationMs: elapsed,
        };
      } finally {
        // Dispose the store to prevent subscription leaks
        store?.dispose();
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
  ): { ctx: ScenarioContext; store: DeviceStateStoreImpl } {
    const { protocol, registerPayload } = agent;
    const messages$ = (protocol as any).transport.messages$;
    const store = new DeviceStateStoreImpl(messages$, timeoutMs);

    const ctx: ScenarioContext = {
      protocol,
      registerPayload,
      provider,
      config,
      deviceState: store,
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
      waitForSomeMessages: (
        predicate: (msg: Message<FromAgent>) => boolean,
        customTimeout?: number,
      ): Promise<Message<FromAgent>[]> => {
        const effectiveTimeout = customTimeout ?? timeoutMs;
        return new Promise<Message<FromAgent>[]>((resolve, reject) => {
          const collected: Message<FromAgent>[] = [];
          const sub = (protocol as any).transport.messages$.pipe(
            filter((msg: Message<FromAgent>) => predicate(msg)),
          ).subscribe((msg: Message<FromAgent>) => {
            collected.push(msg);
          });
          setTimeout(() => {
            sub.unsubscribe();
            if (collected.length === 0) {
              reject(new Error(`waitForSomeMessages: no messages matched within ${effectiveTimeout}ms`));
            } else {
              resolve(collected);
            }
          }, effectiveTimeout);
        });
      },
      waitForAllMessages: (
        predicates: ((msg: Message<FromAgent>) => boolean)[],
        customTimeout?: number,
      ): Promise<Message<FromAgent>[]> => {
        return firstValueFrom(
          (protocol as any).transport.messages$.pipe(
            scan(
              (acc: { matched: (Message<FromAgent> | null)[] }, msg: Message<FromAgent>) => {
                const updated = [...acc.matched];
                // Find the first unsatisfied predicate that this message matches
                for (let i = 0; i < predicates.length; i++) {
                  if (updated[i] === null && predicates[i](msg)) {
                    updated[i] = msg;
                    break;
                  }
                }
                return { matched: updated };
              },
              { matched: predicates.map(() => null) },
            ),
            tap((acc: { matched: (Message<FromAgent> | null)[] }) => {
              this.logger.log(acc.matched.filter((m) => m !== null).length + '/' + predicates.length + ' messages matched');
            }),
            filter((acc: { matched: (Message<FromAgent> | null)[] }) => acc.matched.every((m) => m !== null)),
            take(1),
            timeout(customTimeout ?? timeoutMs),
            map((acc: { matched: (Message<FromAgent> | null)[] }) => acc.matched as Message<FromAgent>[]),
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

    return { ctx, store };
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
