import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { firstValueFrom, timeout, filter } from 'rxjs';
import { FromAgent, FromServer, Message } from '@awarevue/api-types';
import { AgentServer } from '../agent-server';
import { InMemoryHub } from '../hubs/in-memory';
import { AGENT_PROTOCOL_VERSION } from '../constants';
import { createTransportPair } from './in-memory-transport';
import { DuplexTransport } from '../transport_types';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

type AgentMsg = Message<FromAgent>;
type ServerMsg = Message<FromServer>;

let msgSeq = 0;
const envelope = (from: string, payload: FromAgent): AgentMsg => ({
  ...payload,
  id: `msg-${++msgSeq}`,
  from,
  version: AGENT_PROTOCOL_VERSION,
  on: Date.now(),
});

const registerPayload = (agentId: string): AgentMsg =>
  envelope(agentId, {
    kind: 'register',
    providers: {
      'test-provider': {
        title: 'Test Provider',
        configSchema: {},
        configDefault: {},
      },
    },
  });

const startRsPayload = (agentId: string, requestId: string): AgentMsg =>
  envelope(agentId, { kind: 'start-rs', requestId });

const stopRsPayload = (agentId: string, requestId: string): AgentMsg =>
  envelope(agentId, { kind: 'stop-rs', requestId });

/**
 * Connects a fake agent to the hub and returns the agent's side of the transport.
 */
function connectAgent(
  hub: InMemoryHub<AgentMsg, ServerMsg, number>,
  peerId: number,
) {
  const [agentSide, serverSide] = createTransportPair<ServerMsg, AgentMsg>();
  hub.addPeer(peerId, serverSide);
  return agentSide;
}

/**
 * Subscribe BEFORE sending — in-memory transports deliver synchronously,
 * so the reply arrives during send() and is missed if subscribed after.
 */
function sendAndAwait(
  agent: DuplexTransport<ServerMsg, AgentMsg>,
  msg: AgentMsg,
  replyKind: string,
): Promise<ServerMsg> {
  const p = firstValueFrom(
    agent.messages$.pipe(
      filter((m) => m.kind === replyKind),
      timeout(1000),
    ),
  );
  agent.send(msg);
  return p;
}

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe('AgentServer', () => {
  let hub: InMemoryHub<AgentMsg, ServerMsg, number>;
  let server: AgentServer<number>;

  beforeEach(() => {
    hub = new InMemoryHub();
    msgSeq = 0;
  });

  afterEach(() => {
    server?.finalize();
    hub?.close();
  });

  // ── Registration ──────────────────────────────────────────────────

  describe('registration', () => {
    it('should resolve agentId from msg.from on register', async () => {
      const registered: string[] = [];

      server = new AgentServer(hub, {
        onRegister: ({ agentId, accept }) => {
          registered.push(agentId);
          accept();
        },
      });
      server.init();

      const agent = connectAgent(hub, 1);
      const reply = await sendAndAwait(
        agent,
        registerPayload('my-agent'),
        'register-rs',
      );

      expect(reply.kind).toBe('register-rs');
      expect(registered).toEqual(['my-agent']);
    });

    it('should allow rejecting registration', async () => {
      server = new AgentServer(hub, {
        onRegister: ({ reject }) => {
          reject('not allowed');
        },
      });
      server.init();

      const agent = connectAgent(hub, 1);
      const reply = await sendAndAwait(
        agent,
        registerPayload('bad-agent'),
        'error-rs',
      );

      expect(reply.kind).toBe('error-rs');
      expect((reply as any).error).toBe('not allowed');
    });

    it('should handle multiple agents with different peer IDs', async () => {
      const registered: string[] = [];

      server = new AgentServer(hub, {
        onRegister: ({ agentId, accept }) => {
          registered.push(agentId);
          accept();
        },
      });
      server.init();

      const agentA = connectAgent(hub, 1);
      const agentB = connectAgent(hub, 2);

      await sendAndAwait(agentA, registerPayload('agent-alpha'), 'register-rs');
      await sendAndAwait(agentB, registerPayload('agent-beta'), 'register-rs');

      expect(registered).toContain('agent-alpha');
      expect(registered).toContain('agent-beta');
    });
  });

  // ── Start / Stop ──────────────────────────────────────────────────

  describe('start and stop', () => {
    it('should route startAgent by agentId to correct peer', async () => {
      server = new AgentServer(hub, {
        onRegister: ({ accept }) => accept(),
      });
      server.init();

      const agentA = connectAgent(hub, 1);
      const agentB = connectAgent(hub, 2);

      await sendAndAwait(agentA, registerPayload('agent-alpha'), 'register-rs');
      await sendAndAwait(agentB, registerPayload('agent-beta'), 'register-rs');

      // subscribe before sending
      const startPromise = firstValueFrom(
        agentB.messages$.pipe(
          filter((m) => m.kind === 'start'),
          timeout(1000),
        ),
      );

      server.startAgent({
        agentId: 'agent-beta',
        provider: 'test-provider',
        config: { url: 'http://test' },
        lastEventForeignRef: null,
        lastEventTimestamp: null,
      });

      const startMsg = await startPromise;
      expect(startMsg.kind).toBe('start');
      expect((startMsg as any).provider).toBe('test-provider');
    });

    it('should fire onStarted when agent replies with start-rs', async () => {
      const started: string[] = [];

      server = new AgentServer(hub, {
        onRegister: ({ accept }) => accept(),
        onStarted: ({ agentId }) => started.push(agentId),
      });
      server.init();

      const agent = connectAgent(hub, 1);
      await sendAndAwait(agent, registerPayload('my-agent'), 'register-rs');

      agent.send(startRsPayload('my-agent', 'req-1'));

      expect(started).toEqual(['my-agent']);
    });

    it('should fire onStopped when agent replies with stop-rs', async () => {
      const stopped: string[] = [];

      server = new AgentServer(hub, {
        onRegister: ({ accept }) => accept(),
        onStopped: ({ agentId }) => stopped.push(agentId),
      });
      server.init();

      const agent = connectAgent(hub, 1);
      await sendAndAwait(agent, registerPayload('my-agent'), 'register-rs');

      agent.send(stopRsPayload('my-agent', 'req-2'));

      expect(stopped).toEqual(['my-agent']);
    });

    it('should send stop to the correct agent', async () => {
      server = new AgentServer(hub, {
        onRegister: ({ accept }) => accept(),
      });
      server.init();

      const agent = connectAgent(hub, 1);
      await sendAndAwait(agent, registerPayload('my-agent'), 'register-rs');

      const stopPromise = firstValueFrom(
        agent.messages$.pipe(
          filter((m) => m.kind === 'stop'),
          timeout(1000),
        ),
      );

      server.stopAgent('my-agent', 'test-provider');

      const stopMsg = await stopPromise;
      expect(stopMsg.kind).toBe('stop');
      expect((stopMsg as any).provider).toBe('test-provider');
    });
  });

  // ── Disconnect ────────────────────────────────────────────────────

  describe('disconnect', () => {
    it('should fire onUnregistered with agentId when peer disconnects after registration', async () => {
      const unregistered: string[] = [];

      server = new AgentServer(hub, {
        onRegister: ({ accept }) => accept(),
        onUnregistered: ({ agentId }) => unregistered.push(agentId),
      });
      server.init();

      const agent = connectAgent(hub, 1);
      await sendAndAwait(agent, registerPayload('my-agent'), 'register-rs');

      agent.close();

      expect(unregistered).toEqual(['my-agent']);
    });

    it('should not fire onUnregistered for peers that never registered', async () => {
      const unregistered: string[] = [];

      server = new AgentServer(hub, {
        onUnregistered: ({ agentId }) => unregistered.push(agentId),
      });
      server.init();

      // connect and immediately disconnect without registering
      const agent = connectAgent(hub, 1);
      agent.close();
      await new Promise((r) => setTimeout(r, 10));

      expect(unregistered).toEqual([]);
    });

    it('should clean up maps after disconnect', async () => {
      server = new AgentServer(hub, {
        onRegister: ({ accept }) => accept(),
      });
      server.init();

      const agent = connectAgent(hub, 1);
      await sendAndAwait(agent, registerPayload('my-agent'), 'register-rs');

      expect(server.getAgentSender('my-agent')).not.toBeNull();

      agent.close();

      expect(server.getAgentSender('my-agent')).toBeNull();
    });
  });

  // ── Protocol validation ───────────────────────────────────────────

  describe('protocol validation', () => {
    it('should reject messages with wrong protocol version', async () => {
      server = new AgentServer(hub);
      server.init();

      const notifications: string[] = [];
      server.notifications$.subscribe((n) => notifications.push(n));

      const agent = connectAgent(hub, 1);

      const badMsg: AgentMsg = {
        kind: 'register',
        providers: {},
        id: 'bad-1',
        from: 'bad-agent',
        version: 999,
        on: Date.now(),
      };

      const reply = await sendAndAwait(agent, badMsg, 'error-rs');

      expect(reply.kind).toBe('error-rs');
      expect((reply as any).error).toContain('Incompatible protocol version');
      expect(notifications.some((n) => n.includes('incompatible'))).toBe(true);
    });
  });

  // ── messages$ stream ──────────────────────────────────────────────

  describe('messages$ stream', () => {
    it('should include agentId alongside peer in emitted messages', async () => {
      server = new AgentServer(hub, {
        onRegister: ({ accept }) => accept(),
      });
      server.init();

      const emittedPromise = firstValueFrom(
        server.messages$.pipe(timeout(1000)),
      );

      const agent = connectAgent(hub, 42);
      agent.send(registerPayload('stream-agent'));

      const emitted = await emittedPromise;

      expect(emitted.peer).toBe(42);
      expect(emitted.agentId).toBe('stream-agent');
      expect(emitted.msg.kind).toBe('register');
    });
  });

  // ── finalize ──────────────────────────────────────────────────────

  describe('finalize', () => {
    it('should clear internal maps on finalize', async () => {
      server = new AgentServer(hub, {
        onRegister: ({ accept }) => accept(),
      });
      server.init();

      const agent = connectAgent(hub, 1);
      await sendAndAwait(agent, registerPayload('my-agent'), 'register-rs');

      expect(server.getAgentSender('my-agent')).not.toBeNull();

      server.finalize();

      expect(server.getAgentSender('my-agent')).toBeNull();
    });
  });
});
