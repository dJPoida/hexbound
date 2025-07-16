// Client -> Server: End current turn

export interface EndTurnPayload {
  gameId: string;
  turnId: string;
} 