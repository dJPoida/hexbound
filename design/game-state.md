# Game State Management

This document outlines the structure and management of the game state in Hexbound. The game state is the single source of truth for all game-related data at any given moment.

## Storage

The primary store for active game state is **Redis**. Redis is an in-memory data store, which provides the low-latency access required for real-time gameplay. The game state is stored as a single JSON document.

### Redis Key Structure

We use a consistent keying strategy to organize game data in Redis. The key is created using helpers from `src/shared/constants/redis.const.ts`.

- **`game:<gameId>`**: A Redis JSON document that stores the complete state of a single game.

## Game State Data Model

The data model below reflects the `ServerGameState` interface defined in `src/shared/types/socket.types.ts`. This is the structure of the JSON object stored in Redis.

```json
{
  "gameId": "string",
  "gameCode": "string",
  "turnNumber": 1,
  "currentPlayerId": "string",
  "players": [
    {
      "userId": "string",
      "userName": "string"
    }
  ],
  "turnActionLog": [
    {
      "type": "INCREMENT_COUNTER"
    }
  ],
  "mapData": {},
  "gameState": {
    "placeholderCounter": 0
  }
}
```

### Key Properties

-   **`gameId`**: A unique identifier for the game (UUID).
-   **`gameCode`**: The human-readable, shareable code for the game.
-   **`turnNumber`**: The current turn number.
-   **`currentPlayerId`**: The `userId` of the player whose turn it is.
-   **`players`**: An array of player objects participating in the game.
-   **`turnActionLog`**: An array that stores the actions a player takes during their turn before they commit them by ending the turn. This is cleared at the start of each new turn state.
-   **`mapData`**: *(To be defined)* Placeholder for data related to the game map, such as tile information, units, etc.
-   **`gameState`**: A nested object containing the mutable state of the game itself. This is where things like scores, resources, or other counters are kept.

## State Management Flow

1.  **Creation**: When a game is created via `POST /api/games`, the initial `ServerGameState` is created and stored in Redis.
2.  **Modification**: Player actions (like `game:increment_counter`) do not directly modify `gameState`. Instead, they add `TurnAction` objects to the `turnActionLog`.
3.  **Preview**: After an action, the server calculates a temporary "preview" state by applying the `turnActionLog` to the base `gameState` and sends it only to the active player.
4.  **Committing**: When a player ends their turn (`game:end_turn`), the server applies the `turnActionLog`, advances the turn, clears the log, and saves the new authoritative `ServerGameState` to Redis. This new state is then broadcast to all players.

## Persistence

While Redis handles the active game state, **PostgreSQL** is used for long-term storage of game metadata (like the list of players and the game's status) and eventually game results. When a game is `FINISHED`, a summary of the game and its outcome will be written to the Postgres database. 