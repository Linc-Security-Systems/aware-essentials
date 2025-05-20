export interface ErrorResponse {
  code: string;
  message: string;
}

export const isErrorResponse = (obj: unknown): obj is ErrorResponse => {
  return (
    typeof obj === 'object' && obj !== null && 'code' in obj && 'message' in obj
  );
};
