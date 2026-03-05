import { NestFactory } from '@nestjs/core';
import * as yargs from 'yargs';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';
import { CLIOptions } from './cli-options';
import { RunnerService } from './runner.service';

async function bootstrap() {
  const argv = await yargs
    .option('agentId', {
      type: 'string',
      demandOption: true,
      describe: 'Agent ID to expect a connection from',
    })
    .option('tags', {
      type: 'string',
      default: '',
      describe: 'Comma-separated tags to filter scenarios (empty = run all)',
    })
    .option('port', {
      type: 'number',
      default: 3005,
      describe: 'Port to listen on for WebSocket connections',
    })
    .option('timeout', {
      type: 'number',
      default: 30000,
      describe: 'Per-scenario timeout in milliseconds',
    })
    .option('connectionTimeout', {
      type: 'number',
      default: 30000,
      describe: 'How long to wait for agent to connect (ms)',
    })
    .option('report', {
      type: 'string',
      describe: 'Path to write JUnit XML report',
    })
    .option('config', {
      type: 'string',
      describe: 'Path to a JSON file with provider config to use when starting agents',
    })
    .strict()
    .help()
    .parse();

  // Load provider config from JSON file if specified
  let providerConfig: Record<string, unknown> | undefined;
  if (argv.config) {
    const configPath = path.resolve(argv.config);
    if (!fs.existsSync(configPath)) {
      console.error(`Config file not found: ${configPath}`);
      process.exit(1);
    }
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      providerConfig = JSON.parse(raw);
    } catch (err) {
      console.error(`Failed to parse config file: ${(err as Error).message}`);
      process.exit(1);
    }
  }

  const options: CLIOptions = {
    agentId: argv.agentId,
    tags: argv.tags
      ? argv.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    port: argv.port,
    timeout: argv.timeout,
    connectionTimeout: argv.connectionTimeout,
    report: argv.report,
    providerConfig,
  };

  const app = await NestFactory.create(AppModule.forRoot(options), {
    logger: ['error', 'warn', 'log'],
  });

  await app.listen(options.port);
  console.log(`Test agent hub listening on port ${options.port}`);

  // Run scenarios and exit with appropriate code
  const runner = app.get(RunnerService);
  const exitCode = await runner.run();
  await app.close();
  console.log(`Exiting with code ${exitCode}`);
  process.exit(exitCode);
}

bootstrap();
