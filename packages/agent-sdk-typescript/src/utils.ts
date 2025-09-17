export const stringifyError = (error: unknown) => {
  if (error instanceof Error) {
    return `\nMessage: ${error.message}\nStack: ${error.stack}`;
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
