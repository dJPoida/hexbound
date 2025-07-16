// Server -> Client: Error message

// An error message from the server
export interface ErrorPayload {
  message: string;
  details?: unknown;
}
