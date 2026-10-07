# Test Agent Hub — Architecture

## Objective

The **Test Agent Hub** is an automated integration-testing harness for Aware platform agents. It impersonates the Aware server, accepting a WebSocket connection from a real agent instance and exercising it through a battery of **scenarios** — structured, self-contained test cases that verify the agent's protocol compliance, device-discovery flow, state reporting, command handling, and more.

Key goals:

| Goal                     | Detail                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Protocol conformance** | Verify that agents implement the Aware agent protocol correctly (registration, start/stop, request/reply sequencing).     |
| **Behavioral coverage**  | Test domain-specific behaviors (device discovery, door lock/unlock, access-sync validation) without a live Aware backend. |
| **CI-friendly**          | Run headless, exit with a non-zero code on failure, and optionally emit a JUnit XML report for CI pipelines.              |
| **Extensibility**        | New scenarios are added by dropping a `*.scenario.ts` file into the `scenarios/` directory — no wiring required.          |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLI  (main.ts)                           │
│  Parses arguments, loads config, bootstraps the NestJS app      │
└────────────────────────┬────────────────────────────────────────┘
                         │ provides CLIOptions
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AppModule  (app.module.ts)                     │
│  Dynamic NestJS module — registers HubService, RunnerService,   │
│  and the CLI_OPTIONS injection token                            │
└────────┬──────────────────────────────────┬─────────────────────┘
         │                                  │
         ▼                                  ▼
┌─────────────────────┐           ┌────────────────────────┐
│   HubService        │           │   RunnerService        │
│                     │           │                        │
│ • WebSocket server  │  used by  │ • Loads scenarios      │
│ • InMemoryHub       │◄──────────│ • Runs them in order   │
│ • Agent handshake   │           │ • Collects results     │
│                     │           │ • Triggers reporting   │
└─────────────────────┘           └────────────────────────┘
         ▲                                  │
         │ WebSocket                        │ invokes
         │                                  ▼
┌─────────────────────┐           ┌────────────────────────┐
│   Agent under test  │           │   Scenario files       │
│   (external process)│           │   scenarios/*.ts       │
└─────────────────────┘           └────────────────────────┘
```

---

## Component Breakdown

### 1. `main.ts` — Entry Point & CLI

Parses command-line arguments via **yargs**:

| Flag                  | Default      | Purpose                                                                                          |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------------ |
| `--agentId`           | _(required)_ | Agent ID the hub expects to connect                                                              |
| `--tags`              | `""`         | Comma-separated scenario tags for filtering                                                      |
| `--port`              | `3005`       | WebSocket listen port                                                                            |
| `--timeout`           | `30 000`     | Per-scenario timeout (ms)                                                                        |
| `--replyTimeout`      | `10 000`     | Max wait for an agent reply (ms), same as the Aware server; `progress` messages reset it         |
| `--connectionTimeout` | `30 000`     | Max wait for agent to connect (ms)                                                               |
| `--report`            | —            | Path for JUnit XML output                                                                        |
| `--config`            | —            | Path to a JSON file with provider configuration                                                  |
| `--interactive`       | `false`      | An operator is present: run scenarios that ask for physical actions. Without it they are skipped |
| `--list`              | `false`      | List available scenarios and exit (no `--agentId` required)                                      |
| `--verbose`           | `false`      | Show detailed NestJS/protocol debug logs                                                         |
| `--quiet`             | `false`      | Suppress all output except errors and the final summary                                          |
| `--version`           | —            | Print version and exit                                                                           |
| `--help`              | —            | Print usage and exit                                                                             |

After parsing, it creates a NestJS application with `AppModule.forRoot(options)`, starts listening, runs all scenarios through `RunnerService.run()`, and exits with the resulting code (`0` = all passed, `1` = any failure, `2` = invalid arguments/config).

#### CLI usage

```bash
# Run all scenarios
agent-tester --agentId my-agent

# Run only core scenarios, write JUnit report
agent-tester --agentId my-agent --tags core --report results.xml

# List available scenarios
agent-tester --list

# CI mode: quiet, with JUnit report
agent-tester --agentId my-agent --quiet --report results/junit.xml
```

#### Exit codes

| Code | Meaning                                            |
| ---- | -------------------------------------------------- |
| `0`  | All scenarios passed                               |
| `1`  | One or more scenarios failed (or connection error) |
| `2`  | Invalid arguments or configuration error           |

### 2. `cli-options.ts` — Configuration Token

Defines the `CLIOptions` interface and a `CLI_OPTIONS` injection token so that parsed options are available throughout the NestJS DI container.

### 3. `app.module.ts` — NestJS Wiring

A dynamic module (`AppModule.forRoot()`) that registers:

- `HubService` — manages the WebSocket server and agent connections.
- `RunnerService` — orchestrates scenario execution.
- `CLI_OPTIONS` — the parsed options value.

### 4. `hub.service.ts` — WebSocket Server & Agent Handshake

Responsibilities:

1. **WebSocket server** — On module init, attaches a `WebSocketServer` to the underlying HTTP server. Each incoming socket is wrapped in a `WsServerDuplexTransport` and handed to an `InMemoryHub` as a new peer.
2. **`awaitAgent(agentId, timeoutMs)`** — Subscribes to `hub.messages$` and waits for a `register` message from the expected agent. Validates the message using `getAgentMessageIssues()` from `@awarevue/api-types`, then constructs an `AgentProtocol<'server'>` over the peer's transport and replies with `register-rs`. Returns a `ConnectedAgent` handle containing the protocol, the register payload, and the peer ID.
3. **Cleanup** — `close()` shuts down the hub and WebSocket server.

#### Key SDK primitives used

| SDK Type                  | Role in HubService                                                                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `InMemoryHub`             | Multiplexed peer manager — tracks connections, routes messages, emits join/leave events.                                                                                    |
| `DuplexTransport`         | Abstraction over a single bidirectional channel. `WsServerDuplexTransport` implements it for accepted server-side sockets.                                                  |
| `AgentProtocol<'server'>` | Typed request/reply handler. Wraps outbound messages in protocol envelopes (auto-ID, timestamps), correlates replies by `requestId`, and supports RxJS-based `getReply$()`. |

### 5. `ws-server-transport.ts` — Server-side WebSocket Transport

Implements `DuplexTransport<TIn, TOut>` around a server-accepted `WebSocket`. Unlike the client-side `WsDuplexTransport` in the SDK, it has **no reconnect logic** — the connection is already established. Provides:

- `connected$` — `BehaviorSubject<boolean>` reflecting liveness.
- `messages$` — Deserialized inbound messages (JSON envelope `{ event, data }` → flat object with `kind`).
- `send(msg)` — Serializes and sends (`{ kind, ...rest }` → `{ event: kind, data: rest }`).
- `close()` — Graceful close with a 250 ms terminate fallback.

### 6. `runner.service.ts` — Scenario Orchestrator

The central execution engine:

1. **Await agent** — Delegates to `HubService.awaitAgent()`.
2. **Load & filter scenarios** — Uses `loadScenarios()` and `filterScenarios()` from the loader.
3. **Select provider** — Picks the first provider from the agent's registration payload. Uses CLI-supplied `--config` if provided, otherwise falls back to the provider's `configDefault`.
4. **Execute scenarios sequentially** — For each scenario:
   - Builds a `ScenarioContext` with helper methods.
   - Runs `scenario.run(ctx)` wrapped in a per-scenario timeout.
   - Captures the result (pass/fail, errors, duration).
5. **Report** — Prints colored console output; optionally writes JUnit XML.
6. **Cleanup & exit** — Closes the hub, returns exit code.

#### `ScenarioContext` helpers

| Helper                                            | Description                                                                                                                                                |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `protocol`                                        | Direct access to the `AgentProtocol` for raw send/subscribe.                                                                                               |
| `registerPayload`                                 | The agent's registration message (providers, capabilities).                                                                                                |
| `provider` / `config`                             | The chosen provider name and its config object.                                                                                                            |
| `log(msg)`                                        | Append a line to the scenario's log section in the report.                                                                                                 |
| `getReply(payload)`                               | Send a typed request and await its typed reply (promise-based).                                                                                            |
| `waitForMessage(pred, timeout?)`                  | Wait for the next inbound message matching a predicate.                                                                                                    |
| `waitForSomeMessages(pred, timeout?)`             | Collect all matching messages within a timeout window, resolve with the batch.                                                                             |
| `waitForAllMessages(preds, timeout?)`             | Wait until every predicate in the list has been satisfied by a distinct message.                                                                           |
| `waitForKind(kind, timeout?)`                     | Shorthand — wait for the next message of a specific `kind`.                                                                                                |
| `interactive` / `askOperator(instruction, until)` | Whether `--interactive` was given; show an instruction to the operator and wait for `until`, or `"skipped"` if they press Enter.                           |
| `tellOperator(message)`                           | Show the operator a progress message straight away (logs only print at the end), e.g. that their action was seen or that nothing more is needed from them. |

### 7. `loader.ts` — Scenario Discovery

- `loadScenarios()` — Scans the `scenarios/` directory for `*.scenario.{ts,js}` files, `require()`s each, and expects a default export conforming to the `Scenario` interface. Sorts alphabetically for deterministic ordering.
- `filterScenarios(scenarios, tags)` — OR-based tag filter: a scenario is included if it has at least one matching tag. Empty tag list means "run all".

### 8. `scenario.types.ts` — Contracts

Defines the interfaces that scenario authors implement:

- **`Scenario`** — `{ name, description, tags, run(ctx) }`.
- **`ScenarioResult`** — `{ passed, errors[], durationMs }`.
- **`ScenarioContext`** — The rich context object passed into `run()` (see table above).
- **`scenarioPass()` / `scenarioFail(...errors)`** — Convenience builders.

### 9. `reporter.ts` — Output Formatting

Two reporters:

- **Console** — ANSI-colored pass / passed with warnings (`⚠`) / fail / skipped (`○`, with the reason) per scenario with duration and error details. Warnings are highlighted in the scenario's log. A summary line at the end.
- **JUnit XML** — Standard `<testsuites>` format consumable by CI systems (Jenkins, GitHub Actions, etc.). Skipped scenarios get a `<skipped message="…"/>` element; warnings of a passing scenario go in `<system-out>`.

A scenario returns `scenarioSkip(reason)` when it could test nothing against this agent or setup (an unsupported feature, no events, no operator). Skipped scenarios do not affect the exit code. A scenario calls `ctx.warn(msg)` for something that did not fully work but is acceptable for some agents (e.g. an event derived from live state that cannot be replayed); it still passes, reported as "passed with warnings". When only part of a scenario cannot run (e.g. a sub-test needing readers), it logs that and still passes on what it did test.

### 10. `scenarios/` — Test Cases

Scenarios are self-contained files, each default-exporting a `Scenario` object.

| Scenario                        | Tags                | What it verifies                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `register`                      | `core`              | Agent sends a valid registration with ≥ 1 provider, each having a non-empty `title` and valid `configSchema`.                                                                                                                                                                                                                                                                                                               |
| `start-stop`                    | `core`, `lifecycle` | Agent responds correctly to `start` and `stop` commands.                                                                                                                                                                                                                                                                                                                                                                    |
| `device-discovery`              | `core`, `devices`   | After start, `get-available-devices` returns a well-formed device list.                                                                                                                                                                                                                                                                                                                                                     |
| `communicates-bad-references`   | `access`            | A `validate-change` with a fabricated reference yields exactly one `BAD_REFERENCE` issue.                                                                                                                                                                                                                                                                                                                                   |
| `communicates-init-door-states` | `doors`             | After start, the agent emits a `state` message (with `connected` in `mergeProps`) for every discovered door device.                                                                                                                                                                                                                                                                                                         |
| `door-lock-unlock`              | `doors`             | After start, connected doors can receive a `door.unlock` command without error.                                                                                                                                                                                                                                                                                                                                             |
| `validate-config`               | `core`              | Without starting, the working config validates with no issues; removing a required field or mistyping a field (picked from `configSchema`) yields an issue whose `paths` name it.                                                                                                                                                                                                                                           |
| `restart`                       | `core`, `lifecycle` | `stop` then `start` on the same connection (how Aware applies a config change): same devices discovered, and every device that reported `connected` reports it again.                                                                                                                                                                                                                                                       |
| `device-discovery-consistency`  | `core`, `devices`   | Discovery matches the schema, `foreignRef`s are unique, relations point at discovered devices, and a second discovery returns the same devices.                                                                                                                                                                                                                                                                             |
| `batched-mutations`             | `access`            | Several mutations in one request: a resync-style batch creating people and a schedule, and moving a person between rules (`[merge old rule {appliedTo}, merge new rule]`).                                                                                                                                                                                                                                                  |
| `reference-recovery`            | `access`            | `BAD_REFERENCE` / `NOT_FOUND` issues carry `objectKind` + `objectId`; after resyncing the reported objects the change validates and applies.                                                                                                                                                                                                                                                                                |
| `person-validity-dates`         | `access`            | `validFrom` / `validTo` sent as `YYYY-MM-DD` are stored on the right day, changed and cleared. Day slips from UTC parsing only show when the agent runs west of UTC. A provider that cannot store "no date" may report a start of today or earlier / an end ≥ 5 years away (compared by day) — accepted with a log note, since describe should report `null`.                                                               |
| `person-suspension`             | `access`            | `{accessSuspended}` partial merges suspend and reinstate a person without losing other props.                                                                                                                                                                                                                                                                                                                               |
| `person-extra-fields`           | `access`            | Person merges carrying fields outside the schema (credential notes, position, custom fields, whole DTO) are accepted and change nothing else.                                                                                                                                                                                                                                                                               |
| `partial-merge-without-refs`    | `access`            | A partial merge for an object with no refs creates it from `{ ...original, ...props }`.                                                                                                                                                                                                                                                                                                                                     |
| `operator-events`               | `doors`             | `--interactive` only: asks the operator for a request-to-exit, a forced door and a card (an unknown card is fine). Checks each event's kind, a token on the card event, a timestamp matching when it happened, and that access events (`door-access`, `reader-auth`) are replayed after a restart; other events not replayed (e.g. a `door-force` derived from live state) are only noted. Steps can be skipped with Enter. |

---

## Data / Control Flow

```
  Agent Process                            Test Agent Hub
  ─────────────                            ──────────────
        │                                        │
        │── WS connect ──────────────────────────▶│  HubService creates WsServerDuplexTransport
        │                                        │  InMemoryHub.addPeer()
        │                                        │
        │── register ───────────────────────────▶│  HubService.awaitAgent() validates & resolves
        │◀─ register-rs ────────────────────────│  AgentProtocol sends reply
        │                                        │
        │                                        │  RunnerService iterates scenarios:
        │                                        │
        │◀─ start ──────────────────────────────│    ctx.getReply({ kind: 'start', ... })
        │── start-rs ───────────────────────────▶│
        │                                        │
        │◀─ get-available-devices ──────────────│    ctx.getReply({ kind: 'get-available-devices' })
        │── get-available-devices-rs ───────────▶│
        │                                        │
        │── state (unsolicited) ────────────────▶│    ctx.waitForMessage() / waitForAllMessages()
        │                                        │
        │◀─ command ────────────────────────────│    ctx.getReply({ kind: 'command', ... })
        │── command-rs ─────────────────────────▶│
        │                                        │
        │◀─ stop ───────────────────────────────│    ctx.getReply({ kind: 'stop' })
        │── stop-rs ────────────────────────────▶│
        │                                        │
        │  (connection closed)                   │  HubService.close()
```

---

## Writing a New Scenario

1. Create a file `scenarios/my-feature.scenario.ts`.
2. Default-export an object satisfying `Scenario`:

```typescript
import { Scenario, scenarioPass, scenarioFail } from "..";

const scenario: Scenario = {
  name: "my-feature",
  description: "Verifies that my feature works correctly",
  tags: ["custom"],

  async run(ctx) {
    // Use ctx.getReply, ctx.waitForMessage, etc.
    const reply = await ctx.getReply({
      kind: "start",
      provider: ctx.provider,
      config: ctx.config,
    });
    ctx.log(`Start reply received`);

    // ... assertions ...

    await ctx.getReply({ kind: "stop" });
    return scenarioPass();
  },
};

export default scenario;
```

3. Run with `--tags custom` to execute only this scenario, or omit tags to include it in a full run.

---

## CI / CD Integration

### Installation

The package (`@awarevue/agent-tester-cli`) exposes an `agent-tester` binary via the `bin` field in `package.json`. After installing, you can run it directly:

```bash
# Via npx
npx @awarevue/agent-tester-cli --agentId my-agent

# Or via the bin symlink after yarn/npm install
./node_modules/.bin/agent-tester --agentId my-agent

# Or in a package.json script
"test:agent": "agent-tester --agentId my-agent --report results/junit.xml"
```

### GitHub Actions example

```yaml
jobs:
  agent-conformance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yarn install
      - run: yarn build
      - name: Start agent under test
        run: node my-agent/dist/main.js &
      - name: Run conformance tests
        run: |
          npx @awarevue/agent-tester-cli \
            --agentId my-agent \
            --quiet \
            --report results/junit.xml
      - uses: dorny/test-reporter@v1
        if: always()
        with:
          name: Agent Conformance
          path: results/junit.xml
          reporter: java-junit
```

### Exit codes

| Code | Meaning                                            |
| ---- | -------------------------------------------------- |
| `0`  | All scenarios passed                               |
| `1`  | One or more scenarios failed (or connection error) |
| `2`  | Invalid arguments or configuration error           |

---

## Dependencies

| Package               | Role                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| `@awarevue/agent-sdk` | `AgentProtocol`, `InMemoryHub`, `DuplexTransport` — core protocol and transport abstractions.     |
| `@awarevue/api-types` | Typed message definitions (`FromAgent`, `FromServer`, `RegisterRq`, etc.) and validation helpers. |
| `@nestjs/*`           | Dependency injection, HTTP server bootstrap, lifecycle hooks.                                     |
| `ws`                  | WebSocket server implementation.                                                                  |
| `rxjs`                | Reactive message streams, filtering, timeouts.                                                    |
| `yargs`               | CLI argument parsing.                                                                             |
| `uuid`                | Unique ID generation for protocol envelopes.                                                      |
