import { Subject, firstValueFrom } from 'rxjs';
import { AgentCommunicationClient } from './agent-communication-client';
import { Transport } from '../transport/transport';
import { Message, FromAgent, FromServer } from '@awarevue/api-types';

type TestPeer = string;

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
  sent: Array<Message<any>> = [];
  closed = false;
  send(msg: any) {
    this.sent.push(msg);
  }
  close() {
    this.closed = true;
  }
}

// Helper to craft server messages (responses)
const serverMsg = (kind: string, requestId?: string, extra: any = {}): any => ({
  id: (Math.random() * 100000).toFixed(0),
  from: 'server-hub',
  version: 99,
  on: Date.now(),
  kind,
  ...(requestId ? { requestId } : {}),
  ...extra,
});

describe('AgentCommunicationClient', () => {
  const agentId = 'agent-A';
  const version = 7;
  let transport: MockTransport;
  let client: AgentCommunicationClient<TestPeer>;

  beforeEach(() => {
    transport = new MockTransport();
    client = new AgentCommunicationClient<TestPeer>(
      transport,
      agentId,
      version,
    );
  });

  describe('connected$', () => {
    it('maps transport tuple to boolean only', () => {
      const states: boolean[] = [];
      client.connected$.subscribe((v) => states.push(v));
      transport.connected$.next([true, 'peer1']);
      transport.connected$.next([false, 'peer1']);
      expect(states).toEqual([true, false]);
    });
  });

  describe('messages$', () => {
    it('emits server messages only', async () => {
      const msg = serverMsg('register-rs');
      const p = firstValueFrom(client.messages$);
      transport.messages$.next([msg, 'peer']);
      const received = await p;
      expect(received).toEqual(msg);
    });
  });

  describe('send()', () => {
    it('envelopes agent message and sends with null peer', () => {
      const payload: FromAgent = {
        kind: 'register',
        providerId: 'prov1',
      } as any;
      client.send(payload);
      expect(transport.sent).toHaveLength(1);
      const sent = transport.sent[0];
      expect(sent.kind).toBe('register');
      expect(sent.from).toBe(agentId);
      expect(sent.version).toBe(version);
      expect(sent).not.toBe(payload);
      expect(sent.id).toBeDefined();
      expect(sent.on).toBeDefined();
    });
  });

  describe('getReply$', () => {
    it('resolves with matching response', async () => {
      const rq: FromAgent = { kind: 'register', providerId: 'p1' } as any;
      const obs = client.getReply$('register-rs', rq, 500);
      const promise = firstValueFrom(obs);
      setTimeout(() => {
        const sent = transport.sent[0];
        transport.messages$.next([
          serverMsg('register-rs', sent.id, { ack: true }),
          'peer',
        ]);
      }, 0);
      const rs = await promise;
      expect(rs.kind).toBe('register-rs');
      expect(rs.requestId).toBe(transport.sent[0].id);
    });

    it('rejects when error-rs with matching requestId arrives first', async () => {
      const rq: FromAgent = { kind: 'register', providerId: 'p1' } as any;
      const promise = firstValueFrom(client.getReply$('register-rs', rq, 500));
      setTimeout(() => {
        const sent = transport.sent[0];
        transport.messages$.next([
          serverMsg('error-rs', sent.id, { error: 'bad' }),
          'peer',
        ]);
      }, 0);
      await expect(promise).rejects.toThrow('bad');
    });

    it('ignores error-rs with different requestId', async () => {
      const rq: FromAgent = { kind: 'register', providerId: 'p1' } as any;
      const promise = firstValueFrom(client.getReply$('register-rs', rq, 500));
      setTimeout(() => {
        const sent = transport.sent[0];
        // unrelated error
        transport.messages$.next([
          serverMsg('error-rs', 'DIFF', { error: 'ignore' }),
          'peer',
        ]);
        transport.messages$.next([
          serverMsg('register-rs', sent.id, { ack: true }),
          'peer',
        ]);
      }, 0);
      const rs = await promise;
      expect(rs.kind).toBe('register-rs');
    });

    it('times out when no reply', async () => {
      const rq: FromAgent = { kind: 'register', providerId: 'p1' } as any;
      const promise = firstValueFrom(client.getReply$('register-rs', rq, 50));
      await expect(promise).rejects.toThrow();
    });

    it('handles immediate response (race)', async () => {
      const rq: FromAgent = { kind: 'register', providerId: 'p1' } as any;
      const promise = firstValueFrom(client.getReply$('register-rs', rq, 300));
      setTimeout(() => {
        const sent = transport.sent[0];
        transport.messages$.next([
          serverMsg('register-rs', sent.id, { ack: true }),
          'peer',
        ]);
      }, 0);
      const rs = await promise;
      expect(rs.kind).toBe('register-rs');
    });

    it('supports concurrent requests', async () => {
      const rq1: FromAgent = { kind: 'register', providerId: 'p1' } as any;
      const rq2: FromAgent = { kind: 'register', providerId: 'p2' } as any;
      const p1 = firstValueFrom(client.getReply$('register-rs', rq1, 500));
      const p2 = firstValueFrom(client.getReply$('register-rs', rq2, 500));
      setTimeout(() => {
        const sent1 = transport.sent[0];
        const sent2 = transport.sent[1];
        transport.messages$.next([
          serverMsg('register-rs', sent2.id, { ack: true }),
          'peer',
        ]);
        transport.messages$.next([
          serverMsg('register-rs', sent1.id, { ack: true }),
          'peer',
        ]);
      }, 0);
      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1.requestId).not.toBe(r2.requestId);
    });
  });

  describe('close()', () => {
    it('delegates to transport.close', () => {
      client.close();
      expect(transport.closed).toBe(true);
    });
  });
});
