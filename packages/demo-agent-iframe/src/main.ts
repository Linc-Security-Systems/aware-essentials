import { AgentApp, WsJsonEncoder, LoggingDuplexTransport, DuplexTransport } from '@awarevue/agent-sdk';
import { PostMessageIframeDuplexTransport } from '@awarevue/agent-sdk-browser';
import { FromAgent, FromServer, Message } from '@awarevue/api-types';
import { Subject } from 'rxjs';
import { smartLockAgent, providers, lockStates, lockStateChange$, PROVIDER } from './smart-lock-agent';

/* ---------------------------------------------------------------- */
/* UI helpers                                                       */
/* ---------------------------------------------------------------- */

const connDot = document.getElementById('conn-dot')!;
const connLabel = document.getElementById('conn-label')!;
const logEl = document.getElementById('log')!;

function setConnStatus(state: 'connecting' | 'connected' | 'running'): void {
  connDot.className = state;
  connLabel.textContent = state.toUpperCase();
}

function addLog(msg: string): void {
  const el = document.createElement('div');
  const ts = new Date().toLocaleTimeString();
  el.textContent = `[${ts}] ${msg}`;
  logEl.appendChild(el);
  logEl.scrollTop = logEl.scrollHeight;
}

function updateLockUI(foreignRef: string, locked: boolean): void {
  const badge = document.getElementById(`badge-${foreignRef}`);
  if (!badge) return;
  badge.className = `lock-badge ${locked ? 'locked' : 'unlocked'}`;
  badge.textContent = locked ? 'LOCKED' : 'UNLOCKED';
}

/* ---------------------------------------------------------------- */
/* Bootstrap                                                        */
/* ---------------------------------------------------------------- */

setConnStatus('connecting');
addLog('Initialising Smart Lock agent…');

// Subject used by the logger callback to route incoming server messages to UI
const inbound$ = new Subject<Message<FromServer>>();

const rawTransport = new PostMessageIframeDuplexTransport({ targetOrigin: '*' });
const encodedTransport = new WsJsonEncoder(rawTransport);
const loggingTransport = new LoggingDuplexTransport(encodedTransport, {
  label: 'demo_agent',
  logger(direction, label, msg) {
    console.log(`[${label}] ${direction}`, JSON.stringify(msg));
    if (direction === 'IN') {
      inbound$.next(msg as Message<FromServer>);
    }
  },
});

// Observe incoming server messages for connection / status UI updates
inbound$.subscribe((msg) => {
  if (msg.kind === 'register-rs') {
    setConnStatus('connected');
    addLog('Registered with host ✓');
  } else if (msg.kind === 'start') {
    setConnStatus('running');
    addLog(`Started provider "${msg.provider}"`);
  } else if (msg.kind === 'stop') {
    setConnStatus('connected');
    addLog(`Stopping provider "${msg.provider}"…`);
  }
});

// Observe lock state changes emitted by the agent's run$ (via lockStateChange$)
lockStateChange$.subscribe(({ foreignRef, locked }) => {
  updateLockUI(foreignRef, locked);
  addLog(`${foreignRef}: ${locked ? 'locked 🔒' : 'unlocked 🔓'}`);
});

const app = new AgentApp(smartLockAgent, {
  agentId: 'demo_agent',
  providers,
  transport: loggingTransport as unknown as DuplexTransport<
    Message<FromServer>,
    Message<FromAgent>
  >,
});

// Initialise door badge UI from starting state
Object.entries(lockStates).forEach(([foreignRef, { locked }]) => {
  updateLockUI(foreignRef, locked);
});

addLog(`Connecting to host (provider: ${PROVIDER})…`);
app.start();
