import { setupServer, startAgent, stopAgent } from './server-setup';
import { addLog, btnStart, btnStop, setStatus } from './ui';

document.addEventListener('DOMContentLoaded', () => {
  setupServer({
    onStatusChange(agentId, status) {
      setStatus(agentId, status);
    },
    onNotification(msg, kind = 'info') {
      addLog(msg, kind);
    },
  });

  btnStart.addEventListener('click', () => {
    startAgent();
    addLog('Sent start command…', 'info');
  });

  btnStop.addEventListener('click', () => {
    stopAgent();
    addLog('Sent stop command…', 'info');
  });
});
