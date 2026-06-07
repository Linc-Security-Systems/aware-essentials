import { AgentStatus } from './server-setup';

const dot = document.getElementById('status-dot')!;
const label = document.getElementById('status-label')!;
const agentIdRow = document.getElementById('agent-id-row')!;
const btnStart = document.getElementById('btn-start') as HTMLButtonElement;
const btnStop = document.getElementById('btn-stop') as HTMLButtonElement;
const log = document.getElementById('log')!;

export { btnStart, btnStop };

const STATUS_LABELS: Record<AgentStatus, string> = {
  offline: 'OFFLINE',
  registered: 'REGISTERED',
  running: 'RUNNING',
  stopped: 'STOPPED',
};

export function setStatus(agentId: string, status: AgentStatus): void {
  dot.className = `offline ${status}`;
  label.textContent = STATUS_LABELS[status];
  agentIdRow.textContent = `Agent: ${agentId}`;

  const isRegistered = status === 'registered' || status === 'running' || status === 'stopped';
  btnStart.disabled = !isRegistered || status === 'running';
  btnStop.disabled = !isRegistered || status !== 'running';
}

export function addLog(
  msg: string,
  kind: 'info' | 'ok' | 'warn' = 'info',
): void {
  const entry = document.createElement('div');
  entry.className = `log-entry ${kind}`;
  const ts = new Date().toLocaleTimeString();
  entry.textContent = `[${ts}] ${msg}`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}
