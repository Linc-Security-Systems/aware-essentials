import { AgentErrorCode } from '@awarevue/api-types';

export class AgentError extends Error {
  constructor(
    message: string,
    public readonly code: AgentErrorCode,
  ) {
    super(message);
    this.name = 'AgentError';
  }
}
