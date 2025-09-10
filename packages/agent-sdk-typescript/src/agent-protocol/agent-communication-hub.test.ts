import { Subject, firstValueFrom } from 'rxjs';
import { AgentCommunicationHub } from './agent-communication-hub';
import { Transport } from '../transport/transport';
import {
  PayloadByKind,
  Message,
  FromAgent,
  FromServer,
} from '@awarevue/api-types';

// Mock ESM-only uuid package to avoid Jest CommonJS parsing issues
jest.mock(
  'uuid',
  () => ({
    v4: () => 'mock-uuid',
  }),
  { virtual: true },
);

// Utility types for test messages
type TestPeer = string; // simulate a peer identifier (e.g., ws connection id)

// Simple mock transport implementation using Subjects
class MockTransport
  implements
    Transport<
      Message<FromServer | FromAgent>,
      Message<FromServer | FromAgent>,
      TestPeer
    >
{
  connected$ = new Subject<[boolean, TestPeer]>();
  messages$ = new Subject<[Message<FromServer | FromAgent>, TestPeer]>();
  sent: Array<{ msg: any; to: TestPeer | null }> = [];
  closed = false;
  send(msg: any, to: TestPeer | null) {
    this.sent.push({ msg, to });
  }
  close() {
    this.closed = true;
  }
}

// Helper to create a base agent-originated message
const mkAgentMsg = <K extends keyof PayloadByKind>(
  kind: K,
  from: string,
  extra: Partial<Message<PayloadByKind[K]>> = {},
): Message<PayloadByKind[K]> => ({
  // minimal header fields; addEnvelope not used because agent emits raw payload
  id: (Math.random() * 100000).toFixed(0),
  from,
  version: 1,
  on: Date.now(),
  kind: kind as any,
  ...(extra as any),
});

// Silence console.warn for predictable tests while still allowing inspection
const originalWarn = console.warn;
let warnMessages: string[] = [];
beforeEach(() => {
  warnMessages = [];
  console.warn = (msg?: any) => {
    warnMessages.push(String(msg));
  };
});
afterAll(() => {
  console.warn = originalWarn;
});

describe('AgentCommunicationHub', () => {
  const version = 42;
  const hubName = 'hubX';
  let transport: MockTransport;
  let hub: AgentCommunicationHub<TestPeer>;

  beforeEach(() => {
    transport = new MockTransport();
    hub = new AgentCommunicationHub<TestPeer>(transport, version, hubName);
  });

  describe('routing & messages$', () => {
    it('maps peer to agent id on first message and emits message', async () => {
      const agentId = 'agent-1';
      const peer = 'peerA';
      const msg = mkAgentMsg('register', agentId);
      const nextPromise = firstValueFrom(hub.messages$);
      transport.messages$.next([msg, peer]);
      const [received, id] = await nextPromise;
      expect(id).toBe(agentId);
      expect(received).toEqual(msg);
    });

    it('supports multiple peers with different agents', async () => {
      const msgs: Array<[Message<any>, string]> = [];
      const sub = hub.messages$.subscribe((m) => msgs.push(m as any));
      transport.messages$.next([mkAgentMsg('register', 'a1'), 'p1']);
      transport.messages$.next([mkAgentMsg('register', 'a2'), 'p2']);
      expect(msgs.map(([, id]) => id).sort()).toEqual(['a1', 'a2']);
      sub.unsubscribe();
    });

    it('re-maps same peer to new agent id if from changes', async () => {
      const peer = 'peerZ';
      transport.messages$.next([mkAgentMsg('register', 'old'), peer]);
      transport.messages$.next([mkAgentMsg('register', 'new'), peer]);
      // Send a follow-up message; should be attributed to new id
      const follow = mkAgentMsg('register', 'new');
      const nextPromise = firstValueFrom(hub.messages$);
      transport.messages$.next([follow, peer]);
      const [, id] = await nextPromise;
      expect(id).toBe('new');
    });
  });

  describe('connected$ & unregister injection', () => {
    it('emits connected then disconnected and injects unregister message', async () => {
      const peer = 'peer1';
      const agentId = 'agentA';
      // Establish mapping (subscribe first so side-effect runs)
      const subMap = hub.messages$.subscribe(() => {});
      transport.messages$.next([mkAgentMsg('register', agentId), peer]);
      subMap.unsubscribe();
      const events: Array<readonly [boolean, string]> = [];
      hub.connected$.subscribe((e) => events.push(e));
      // Capture next emission after disconnect (expected to be injected unregister)
      const injectedCapture = firstValueFrom(hub.messages$);
      transport.connected$.next([true, peer]);
      transport.connected$.next([false, peer]);
      const injected = await injectedCapture;
      expect(injected[0].kind).toBe('unregister');
      expect(injected[0].from).toBe(agentId);
      expect(events).toEqual([
        [true, agentId],
        [false, agentId],
      ]);
    });

    it('does not emit connected events before mapping exists', async () => {
      const peer = 'peerNoMap';
      const received: any[] = [];
      hub.connected$.subscribe((v) => received.push(v));
      transport.connected$.next([true, peer]);
      expect(received).toHaveLength(0);
    });
  });

  describe('send()', () => {
    it('sends message when agent mapping exists with proper envelope', () => {
      const agentId = 'agent-send';
      const peer = 'peer-send';
      // establish mapping (subscribe first)
      const mapSub = hub.messages$.subscribe(() => {});
      transport.messages$.next([mkAgentMsg('register', agentId), peer]);
      mapSub.unsubscribe();
      const payload: FromServer = {
        kind: 'start',
        // request payload fields
        serviceId: 'svc',
      } as any; // Cast for test simplicity
      hub.send(payload, agentId);
      expect(transport.sent).toHaveLength(1);
      const sent = transport.sent[0].msg;
      expect(sent.from).toBe(hubName);
      expect(sent.version).toBe(version);
      expect(sent.kind).toBe('start');
      expect(sent).not.toBe(payload); // new object
    });

    it('warns and does not send when mapping missing', () => {
      hub.send({ kind: 'start-rs', serviceId: 'svc' } as any, 'unknown');
      expect(transport.sent).toHaveLength(0);
      expect(
        warnMessages.some((m) => m.includes('No transport peer found')),
      ).toBeTruthy();
    });
  });

  describe('getReply$', () => {
    const agentId = 'agent-reply';
    const peer = 'peer-reply';

    beforeEach(() => {
      // establish mapping (subscribe first to trigger mergeMap side-effect)
      const mapSub = hub.messages$.subscribe(() => {});
      transport.messages$.next([mkAgentMsg('register', agentId), peer]);
      mapSub.unsubscribe();
    });

    it('resolves with first matching response', async () => {
      const rqPayload: FromServer = {
        kind: 'start',
        serviceId: 'svc',
      } as any; // start request expecting start-rs response
      const obs = hub.getReply$(agentId, 'start-rs', rqPayload, 500);
      const subPromise = firstValueFrom(obs);
      // Simulate agent response after send call occurs: need request id used by hub
      // Extract id from sent message
      setTimeout(() => {
        const sent = transport.sent[0].msg; // envelope created
        const rs: any = {
          ...mkAgentMsg('start-rs', agentId),
          requestId: sent.id,
          serviceId: 'svc',
        };
        transport.messages$.next([rs, peer]);
      }, 0);
      const response = await subPromise;
      expect(response.kind).toBe('start-rs');
    });

    it('rejects when error-rs for matching requestId arrives first', async () => {
      const rqPayload: FromServer = {
        kind: 'start',
        serviceId: 'svc',
      } as any;
      const obs = hub.getReply$(agentId, 'start-rs', rqPayload, 500);
      const promise = firstValueFrom(obs);
      setTimeout(() => {
        const sent = transport.sent[0].msg;
        const err: any = {
          ...mkAgentMsg('error-rs', agentId),
          requestId: sent.id,
          error: 'boom',
        };
        transport.messages$.next([err, peer]);
      }, 0);
      await expect(promise).rejects.toThrow('boom');
    });

    it('ignores error-rs with different requestId', async () => {
      const rqPayload: FromServer = {
        kind: 'start',
        serviceId: 'svc',
      } as any;
      const obs = hub.getReply$(agentId, 'start-rs', rqPayload, 500);
      const promise = firstValueFrom(obs);
      setTimeout(() => {
        const sent = transport.sent[0].msg;
        // Different request id error
        const err: any = {
          ...mkAgentMsg('error-rs', agentId),
          requestId: 'DIFF',
          error: 'ignore',
        };
        transport.messages$.next([err, peer]);
        const rs: any = {
          ...mkAgentMsg('start-rs', agentId),
          requestId: sent.id,
          serviceId: 'svc',
        };
        transport.messages$.next([rs, peer]);
      }, 0);
      const response = await promise;
      expect(response.kind).toBe('start-rs');
    });

    it('times out when no reply', async () => {
      const rqPayload: FromServer = {
        kind: 'start',
        serviceId: 'svc',
      } as any;
      const obs = hub.getReply$(agentId, 'start-rs', rqPayload, 50);
      await expect(firstValueFrom(obs)).rejects.toThrow();
    });

    it('handles immediate response (race)', async () => {
      const rqPayload: FromServer = {
        kind: 'start',
        serviceId: 'svc',
      } as any;
      const obs = hub.getReply$(agentId, 'start-rs', rqPayload, 200);
      const promise = firstValueFrom(obs);
      // Immediately push response after we expect send to have happened (microtask)
      setTimeout(() => {
        const sent = transport.sent[0].msg;
        const rs: any = {
          ...mkAgentMsg('start-rs', agentId),
          requestId: sent.id,
          serviceId: 'svc',
        };
        transport.messages$.next([rs, peer]);
      }, 0);
      const response = await promise;
      expect(response.kind).toBe('start-rs');
    });

    it('multiple concurrent replies do not interfere', async () => {
      const rq1: FromServer = { kind: 'start', serviceId: 'svc1' } as any;
      const rq2: FromServer = { kind: 'start', serviceId: 'svc2' } as any;
      const p1 = firstValueFrom(hub.getReply$(agentId, 'start-rs', rq1, 500));
      const p2 = firstValueFrom(hub.getReply$(agentId, 'start-rs', rq2, 500));
      setTimeout(() => {
        const sent1 = transport.sent[0].msg;
        const sent2 = transport.sent[1].msg;
        const rs1: any = {
          ...mkAgentMsg('start-rs', agentId),
          requestId: sent1.id,
          serviceId: 'svc1',
        };
        const rs2: any = {
          ...mkAgentMsg('start-rs', agentId),
          requestId: sent2.id,
          serviceId: 'svc2',
        };
        transport.messages$.next([rs2, peer]);
        transport.messages$.next([rs1, peer]);
      }, 0);
      const [r1, r2] = await Promise.all([p1, p2]);
      const reqIds = [r1.requestId, r2.requestId];
      expect(reqIds[0]).not.toBe(reqIds[1]);
    });

    it('warns but still listens when mapping missing at send time', async () => {
      const missingAgent = 'missing-agent';
      const obs = hub.getReply$(
        missingAgent,
        'start-rs',
        { kind: 'start', serviceId: 'svc' } as any,
        50,
      );
      await expect(firstValueFrom(obs)).rejects.toThrow(); // timeout
      expect(
        warnMessages.some((m) => m.includes('cannot send message')),
      ).toBeTruthy();
    });

    it('disconnect inject unregister does not satisfy reply filter', async () => {
      const rqPayload: FromServer = {
        kind: 'start',
        serviceId: 'svc',
      } as any;
      const promise = firstValueFrom(
        hub.getReply$(agentId, 'start-rs', rqPayload, 80),
      );
      setTimeout(() => {
        // Cause disconnect -> inject unregister
        transport.connected$.next([false, peer]);
      }, 0);
      await expect(promise).rejects.toThrow();
    });
  });

  describe('close()', () => {
    it('invokes transport.close', () => {
      hub.close();
      expect(transport.closed).toBe(true);
    });
  });

  describe('logging', () => {
    it('logs warn only for missing peer scenarios', () => {
      // missing peer
      hub.send({ kind: 'start-rs', serviceId: 'svc' } as any, 'nope');
      expect(warnMessages.length).toBeGreaterThan(0);
    });
  });
});
