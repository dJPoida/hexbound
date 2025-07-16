// Server -> Client: Counter update payload

// A smaller, more frequent update
export interface CounterUpdatePayload {
  gameId: string;
  newCount: number;
}
