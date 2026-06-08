import { AgentServer, WsJsonHubAdapter } from '@awarevue/agent-sdk';
import { PostMessageHub } from '@awarevue/agent-sdk-browser';

export type AgentStatus = 'offline' | 'registered' | 'running' | 'stopped';

export interface ServerCallbacks {
  onStatusChange: (agentId: string, status: AgentStatus) => void;
  onNotification: (msg: string, kind?: 'info' | 'ok' | 'warn') => void;
}

let server: AgentServer<string> | null = null;
let registeredAgentId: string | null = null;
let registeredProvider: string | null = null;

export function setupServer(callbacks: ServerCallbacks): void {
  const rawHub = new PostMessageHub('*');
  const hub = new WsJsonHubAdapter(rawHub);

  server = new AgentServer(hub, {
    onRegister({ agentId, providers, accept }) {
      registeredAgentId = agentId;
      // Grab the first provider name to use for start/stop
      registeredProvider = Object.keys(providers)[0] ?? null;

      callbacks.onNotification(
        `Agent "${agentId}" registered (providers: ${Object.keys(providers).join(', ')})`,
        'ok',
      );
      callbacks.onStatusChange(agentId, 'registered');
      accept();
    },

    onUnregistered({ agentId, reason }) {
      if (agentId === registeredAgentId) {
        registeredAgentId = null;
        registeredProvider = null;
      }
      callbacks.onNotification(
        `Agent "${agentId}" unregistered${reason ? ` (${reason})` : ''}`,
        'warn',
      );
      callbacks.onStatusChange(agentId, 'offline');
    },

    onStarted({ agentId }) {
      callbacks.onNotification(`Agent "${agentId}" started`, 'ok');
      callbacks.onStatusChange(agentId, 'running');
    },

    onStopped({ agentId }) {
      callbacks.onNotification(`Agent "${agentId}" stopped`, 'warn');
      callbacks.onStatusChange(agentId, 'stopped');
    },
  });

  server.notifications$.subscribe((msg) =>
    callbacks.onNotification(msg, 'info'),
  );

  server.init();
  callbacks.onNotification('Hub listening — waiting for agent to connect…', 'info');
}

export function startAgent(): void {
  if (!server || !registeredAgentId || !registeredProvider) return;
  server.startAgent({
    agentId: registeredAgentId,
    provider: registeredProvider,
    config: {},
    lastEventForeignRef: null,
    lastEventTimestamp: null,
  });
}

export function stopAgent(): void {
  if (!server || !registeredAgentId || !registeredProvider) return;
  void server.stopAgent(registeredAgentId, registeredProvider);
}

export function getRegisteredAgentId(): string | null {
  return registeredAgentId;
}
