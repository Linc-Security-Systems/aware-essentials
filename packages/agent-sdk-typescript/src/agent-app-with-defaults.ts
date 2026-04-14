import { FromAgent, FromServer, Message } from '@awarevue/api-types';
import { Agent } from './agent';
import { AgentApp, AgentOptions } from './agent-app';
import { LoggingDuplexTransport } from './transports/logging';
import { WsDuplexTransport } from './transports/ws';
import { DuplexTransport } from './transport_types';

export type AgentAppWithDefaultsOptions = Omit<AgentOptions, 'transport'> & {
  url: string;
  apiKey: string;
  transport?: DuplexTransport<Message<FromServer>, Message<FromAgent>>;
};

/**
 * Creates an AgentApp instance with default transport settings (WS transport wrapped in a logging decorator) if no custom transport is provided.
 * @param agent The agent instance to use.
 * @param options Configuration options for the AgentApp.
 * @returns A configured AgentApp instance.
 */
export function createAgentApp(
  agent: Agent,
  options: AgentAppWithDefaultsOptions,
): AgentApp {
  const { url, apiKey, transport, ...rest } = options;

  const finalTransport =
    transport ??
    new LoggingDuplexTransport(
      new WsDuplexTransport<Message<FromServer>, Message<FromAgent>>({
        url,
        headers: {
          Authorization: `APIKey ${apiKey}`,
        },
      }),
    );

  return new AgentApp(agent, { ...rest, transport: finalTransport });
}
