// browser-agent-app.ts
// ----------------------------------------------------------------
// Convenience factory that mirrors createAgentApp() from the core SDK
// but defaults to the postMessage transport stack instead of WebSocket.
//
// Consumers who want explicit control can pass a custom `transport`
// (e.g. the full WsJsonEncoder(...) stack) and skip this factory
// entirely — AgentApp / createAgentApp accept any DuplexTransport.
// ----------------------------------------------------------------

import { FromAgent, FromServer, Message } from "@awarevue/api-types";
import {
  Agent,
  AgentApp,
  AgentOptions,
  DuplexTransport,
  LoggingDuplexTransport,
  WsJsonEncoder,
} from "@awarevue/agent-sdk";
import { PostMessageIframeDuplexTransport } from "./post-message-iframe";

/* ---------------------------------------------------------------- */
/* Options                                                          */
/* ---------------------------------------------------------------- */

export type BrowserAgentAppOptions = Omit<AgentOptions, "transport"> & {
  /**
   * Target origin passed to the default `PostMessageIframeDuplexTransport`.
   * Ignored when a custom `transport` is provided.
   * Defaults to `'*'`.
   */
  targetOrigin?: string;

  /**
   * Provide a fully-wired custom transport to replace the default
   * postMessage stack.  Use this to swap in a WebSocket transport for
   * out-of-browser testing without changing any other code.
   */
  transport?: DuplexTransport<Message<FromServer>, Message<FromAgent>>;
};

/* ---------------------------------------------------------------- */
/* Factory                                                          */
/* ---------------------------------------------------------------- */

/**
 * Creates an AgentApp wired to the iframe postMessage transport by default.
 *
 * Transport stack (bottom → top):
 *   PostMessageIframeDuplexTransport  (raw string channel)
 *   → WsJsonEncoder                  ({ event, data } ↔ Message<T>)
 *   → LoggingDuplexTransport         (console logging)
 *   → AgentApp / AgentProtocol
 *
 * To test outside the browser, pass any DuplexTransport<Message<FromServer>,
 * Message<FromAgent>> as the `transport` option — no other changes needed.
 */
export function createBrowserAgentApp(
  agent: Agent,
  options: BrowserAgentAppOptions,
): AgentApp {
  const { targetOrigin, transport, ...rest } = options;

  const finalTransport =
    transport ??
    new LoggingDuplexTransport(
      new WsJsonEncoder(
        new PostMessageIframeDuplexTransport({ targetOrigin }),
      ) as DuplexTransport<Message<FromServer>, Message<FromAgent>>,
    );

  return new AgentApp(agent, { ...rest, transport: finalTransport });
}
