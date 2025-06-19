# Game State Management

This document outlines the structure and management of the game state in Hexbound. The game state is the single source of truth for all game-related data at any given moment.

## Storage

The primary store for active game state is **Redis**. Redis is an in-memory data store, which provides the low-latency access required for real-time gameplay.

### Redis Key Structure

We use a consistent keying strategy to organize game data in Redis. The base key for a game is `game:{gameId}`.

- **`game:{gameId}`**: A Redis Hash that stores the complete state of a single game.

## Game State Data Model

The game state is a JSON object stored in the Redis hash. Below is a high-level overview of its structure.

*(This section will be expanded as game features are developed.)*

```json
{
  "gameId": "string",
  "gameName": "string",
  "status": "LOBBY | IN_PROGRESS | FINISHED",
  "players": [
    {
      "userId": "string",
      "userName": "string",
      "color": "string",
      "isReady": "boolean"
    }
  ],
  "map": {
  },
  "turn": {
    "turnNumber": "number",
    "currentPlayerId": "string"
  }
}
```

### Key Properties

-   **`gameId`**: A unique identifier for the game.
-   **`gameName`**: The user-facing name of the game.
-   **`status`**: The current phase of the game.
-   **`players`**: An array of players participating in the game.
-   **`map`**: The game board state.
-   **`turn`**: Information about the current turn.

## Persistence

While Redis handles the active game state, **PostgreSQL** is used for long-term storage of game results and player data. When a game is `FINISHED`, a summary of the game and its outcome will be written to the Postgres database. 