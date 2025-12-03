import { AgentError } from './agent-error';

export const stringifyError = (error: unknown) => {
  if (error instanceof Error) {
    if (error instanceof AgentError && error.code === 'NOT_SUPPORTED') {
      return `\nMessage: ${error.message}`;
    } else {
      return `\nMessage: ${error.message}\nStack: ${error.stack}`;
    }
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};
