```mermaid
sequenceDiagram
    participant C as Client (Lobby)
    participant S_API as Server (REST API)
    participant DB as Postgres
    participant R as Redis

    C->>S_API: POST /api/games (Create Game)
    S_API->>S_API: Generate unique game code
    S_API->>DB: INSERT INTO "games" (id, code, status, players)
    DB-->>S_API: Return new game record
    S_API->>R: JSON.SET game:<gameId> '{initial state}'
    R-->>S_API: OK
    S_API-->>C: 201 Created { gameId, gameCode }
    
    C->>C: Navigate to Game View (/game/<gameCode>)

    participant C_Game as Client (Game View)
    participant S_WS as Server (WebSocket)

    Note over C_Game, S_WS: Client establishes/reuses WebSocket connection.

    C_Game->>S_WS: Send: { type: "game:subscribe", payload: { gameId: "..." } }
    S_WS->>S_WS: Add client to gameId's subscriber list/room
    S_WS->>R: JSON.GET game:<gameId>
    R-->>S_WS: Full game state
    S_WS-->>C_Game: Push: { type: "game:state_update", payload: { clientGameState } }

    Note over C_Game, S_WS: Player takes an action during their turn

    C_Game->>C_Game: User clicks "Increment"
    C_Game->>S_WS: Send: { type: "game:increment_counter", payload: { gameId: "..." } }
    S_WS->>S_WS: Authorize action (is it user's turn?)
    S_WS->>R: JSON.ARRAPPEND game:<gameId> '$.turnActionLog' '{"type":"INCREMENT_COUNTER"}'
    R-->>S_WS: OK
    S_WS->>R: JSON.GET game:<gameId>
    R-->>S_WS: Full game state with new action in log
    S_WS->>S_WS: Generate preview state (applies actions from log)
    S_WS-->>C_Game: Push: { type: "game:state_update", payload: { previewClientGameState } }

    Note over C_Game, S_WS: Player ends their turn

    C_Game->>C_Game: User clicks "End Turn"
    C_Game->>S_WS: Send: { type: "game:end_turn", payload: { gameId: "..." } }
    S_WS->>S_WS: Authorize action
    S_WS->>R: JSON.GET game:<gameId>
    R-->>S_WS: Full game state
    S_WS->>S_WS: Apply actions from log to state
    S_WS->>S_WS: Advance turn, determine next player
    S_WS->>R: JSON.SET game:<gameId> '{newState, turnActionLog:[]}'
    R-->>S_WS: OK
    
    S_WS-->>C_Game: Push: { type: "game:state_update", payload: { finalNewGameState } }
    participant OtherPlayer as Other Player's Client
    S_WS-->>OtherPlayer: Push: { type: "game:state_update", payload: { finalNewGameState } }
``` 