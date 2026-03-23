import { NestFactory } from "@nestjs/core";
import * as yargs from "yargs";
import * as fs from "fs";
import * as path from "path";
import { AppModule } from "./app.module";
import { CLIOptions } from "./cli-options";
import { RunnerService } from "./runner.service";
import { loadScenarios, filterScenarios } from "./loader";

// ANSI helpers
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";

function getVersion(): string {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8"),
    );
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

function printBanner(version: string): void {
  console.log();
  console.log(`${BOLD}${CYAN}  agent-tester${RESET} ${DIM}v${version}${RESET}`);
  console.log(`${DIM}  Aware Agent Protocol Conformance Test Runner${RESET}`);
  console.log();
}

function printScenarioList(tags: string[]): void {
  const all = loadScenarios();
  const filtered = filterScenarios(all, tags);

  console.log(
    `${BOLD}Available scenarios${RESET} (${filtered.length}/${all.length}):`,
  );
  console.log();

  for (const s of filtered) {
    const tagStr =
      s.tags.length > 0 ? ` ${DIM}[${s.tags.join(", ")}]${RESET}` : "";
    console.log(`  ${CYAN}•${RESET} ${s.name}${tagStr}`);
    if (s.description) {
      console.log(`    ${DIM}${s.description}${RESET}`);
    }
  }

  console.log();
  if (tags.length > 0) {
    console.log(`${DIM}Filtered by tags: ${tags.join(", ")}${RESET}`);
  }
}

async function main(): Promise<void> {
  const argv = await yargs
    .scriptName("agent-tester")
    .usage("$0 --agentId <id> [options]")
    .usage("")
    .usage(
      "Run the Aware agent protocol conformance test suite against a real agent.",
    )
    .usage("The hub starts a WebSocket server, waits for the agent to connect,")
    .usage("then exercises it through a battery of scenarios.")
    .option("agentId", {
      type: "string",
      describe: "Agent ID to expect a connection from",
      group: "Required:",
    })
    .option("tags", {
      type: "string",
      default: "",
      describe: "Comma-separated tags to filter scenarios (e.g. core,doors)",
      group: "Filtering:",
    })
    .option("port", {
      type: "number",
      default: 3005,
      describe: "Port to listen on for WebSocket connections",
      group: "Connection:",
    })
    .option("timeout", {
      type: "number",
      default: 30000,
      describe: "Per-scenario timeout in milliseconds",
      group: "Connection:",
    })
    .option("connectionTimeout", {
      type: "number",
      default: 30000,
      describe: "How long to wait for agent to connect (ms)",
      group: "Connection:",
    })
    .option("report", {
      type: "string",
      describe: "Path to write JUnit XML report (for CI integration)",
      group: "Output:",
    })
    .option("config", {
      type: "string",
      describe: "Path to a JSON file with provider config",
      group: "Configuration:",
    })
    .option("list", {
      type: "boolean",
      default: false,
      describe:
        "List available scenarios and exit (does not require --agentId)",
      group: "Output:",
    })
    .option("verbose", {
      type: "boolean",
      default: false,
      describe: "Show detailed internal logs (NestJS, protocol messages)",
      group: "Output:",
    })
    .option("quiet", {
      type: "boolean",
      default: false,
      describe: "Suppress all output except the final summary and errors",
      group: "Output:",
    })
    .check((argv) => {
      if (argv.verbose && argv.quiet) {
        throw new Error("--verbose and --quiet cannot be used together");
      }
      if (!argv.list && !argv.agentId) {
        throw new Error("--agentId is required (unless using --list)");
      }
      return true;
    })
    .example("$0 --agentId my-agent", 'Run all scenarios against "my-agent"')
    .example(
      "$0 --agentId my-agent --tags core --report results.xml",
      "Run core scenarios, write JUnit report",
    )
    .example("$0 --agentId my-agent --quiet --report junit.xml", "CI mode")
    .example("$0 --list", "Print all available scenarios")
    .example("$0 --list --tags doors", 'Print scenarios tagged "doors"')
    .epilogue(
      "Exit codes:\n" +
        "  0  All scenarios passed\n" +
        "  1  One or more scenarios failed (or connection error)\n" +
        "  2  Invalid arguments or configuration error",
    )
    .strict()
    .help()
    .version(getVersion())
    .wrap(Math.min(100, yargs.terminalWidth()))
    .parse();

  const version = getVersion();
  const quiet = argv.quiet;

  // --- List mode: print scenarios and exit ---
  if (argv.list) {
    const tags = argv.tags
      ? argv.tags
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean)
      : [];
    printBanner(version);
    printScenarioList(tags);
    process.exit(0);
  }

  // --- Run mode ---
  if (!quiet) {
    printBanner(version);
  }

  // Load provider config from JSON file if specified
  let providerConfig: Record<string, unknown> | undefined;
  if (argv.config) {
    const configPath = path.resolve(argv.config);
    if (!fs.existsSync(configPath)) {
      console.error(
        `${RED}Error:${RESET} Config file not found: ${configPath}`,
      );
      process.exit(2);
    }
    try {
      const raw = fs.readFileSync(configPath, "utf-8");
      providerConfig = JSON.parse(raw);
    } catch (err) {
      console.error(
        `${RED}Error:${RESET} Failed to parse config file: ${(err as Error).message}`,
      );
      process.exit(2);
    }
  }

  const options: CLIOptions = {
    agentId: argv.agentId!,
    tags: argv.tags
      ? argv.tags
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean)
      : [],
    port: argv.port,
    timeout: argv.timeout,
    connectionTimeout: argv.connectionTimeout,
    report: argv.report,
    providerConfig,
    verbose: argv.verbose,
    quiet,
  };

  // Determine NestJS log level based on verbosity
  const nestLogLevels: ("error" | "warn" | "log" | "debug" | "verbose")[] =
    argv.verbose
      ? ["error", "warn", "log", "debug", "verbose"]
      : quiet
        ? ["error"]
        : ["error", "warn"];

  const app = await NestFactory.create(AppModule.forRoot(options), {
    logger: nestLogLevels,
  });

  // Graceful shutdown on SIGINT / SIGTERM
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    if (!quiet) {
      console.log(`\n${DIM}Received ${signal}, shutting down...${RESET}`);
    }
    try {
      await app.close();
    } catch {
      /* best-effort */
    }
    process.exit(1);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  await app.listen(options.port);

  if (!quiet) {
    console.log(
      `${DIM}  Listening on port ${RESET}${BOLD}${options.port}${RESET}` +
        `${DIM} · Timeout ${options.timeout}ms · Connection timeout ${options.connectionTimeout}ms${RESET}`,
    );
    if (options.tags.length > 0) {
      console.log(`${DIM}  Tags: ${options.tags.join(", ")}${RESET}`);
    }
    console.log();
  }

  // Run scenarios and exit with appropriate code
  const runner = app.get(RunnerService);
  const exitCode = await runner.run();

  try {
    await app.close();
  } catch {
    /* best-effort */
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error(`${RED}Fatal:${RESET} ${(err as Error).message}`);
  process.exit(2);
});
