export interface CLIOptions {
  /** Agent ID to expect a connection from */
  agentId: string;

  /** Comma-separated tags to filter scenarios (empty = run all) */
  tags: string[];

  /** Port to listen on for WebSocket connections */
  port: number;

  /** Per-scenario timeout in milliseconds */
  timeout: number;

  /**
   * How long to wait for the agent to reply to a request, in milliseconds.
   * Defaults to the Aware server's own reply timeout; progress messages reset it.
   */
  replyTimeout: number;

  /** How long to wait for agent to connect in milliseconds */
  connectionTimeout: number;

  /** Optional path to write JUnit XML report */
  report?: string;

  /** Provider config loaded from a JSON file (via --config) */
  providerConfig?: Record<string, unknown>;

  /** An operator is present to perform physical actions when asked */
  interactive: boolean;

  /** Show detailed internal logs */
  verbose: boolean;

  /** Suppress all output except summary and errors */
  quiet: boolean;
}

export const CLI_OPTIONS = Symbol("CLI_OPTIONS");
