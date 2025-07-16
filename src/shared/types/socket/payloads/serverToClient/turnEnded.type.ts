// Server -> Client: Turn ended notification

export interface GameTurnEndedPayload {
  gameId: string;
  nextPlayerId: string;
  turnNumber: number;
}
