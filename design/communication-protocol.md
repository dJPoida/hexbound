# Communication Protocol

This document defines the communication contract between the Hexbound client and server. This includes the RESTful API for administrative actions and the WebSocket protocol for real-time gameplay.

## 1. RESTful API

The REST API is used for actions that don't require real-time, bi-directional communication, such as user authentication, game creation, and fetching game lists.

### Base URL

-   **Development**: `http://localhost:3000/api`
-   **Production**: `https://your-production-domain.com/api`

### API Endpoints

All API endpoints are prefixed with `/api`. The routes are organized by feature.

#### User (`/user`)

-   **`POST /login`**: Logs in or registers a new user.
    -   **Request Body**: `{ "userName": "string" }`
    -   **Response (200 OK)**:
        ```json
        {
          "userId": "string",
          "userName": "string",
          "sessionToken": "string"
        }
        ```

#### Games (`/games`)

*These endpoints require an authenticated user.*

-   **`GET /`**: Fetches a list of games for the authenticated user.
    -   **Response (200 OK)**: `Array<GameEntity>`
        ```json
        [
          {
            "gameId": "string (uuid)",
            "gameCode": "string (4 chars)",
            "players": [
              {
                "userId": "string (uuid)",
                "userName": "string"
              }
            ],
            "status": {
              "statusId": "number",
              "statusName": "WAITING | IN_PROGRESS | FINISHED"
            }
          }
        ]
        ```
-   **`POST /`**: Creates a new game.
    -   **Request Body**: `{ "gameName": "string" }` (Note: `gameName` is not yet used)
    -   **Response (201 Created)**:
        ```json
        {
          "message": "Game created successfully",
          "gameId": "string",
          "gameCode": "string"
        }
        ```

#### Misc (`/misc`)

-   **`GET /version`**: Returns the application version.
-   **`GET /ping`**: A simple health check endpoint.
-   **`GET /redis-test`**: Tests the connection to the Redis server.

#### Utils (`/utils`)

*These endpoints require an authenticated user and should be used with caution.*

-   **`POST /reset-game-data`**: Resets all game data.

**Example: Create Game**

-   **Endpoint**: `POST /api/games`
-   **Description**: Creates a new game lobby.
-   **Request Body**:
    ```json
    {
      "gameName": "My Awesome Game"
    }
    ```
-   **Response**:
    ```json
    {
      "gameId": "unique-game-id",
      "gameCode": "ABCD"
    }
    ```

## 2. WebSocket Communication

WebSockets are used for real-time gameplay communication, ensuring that all players have a synchronized view of the game state.

### Connection

The client establishes a WebSocket connection to the server. Once connected, it can send and receive messages.

### Message Format

All WebSocket messages are JSON objects with a `type` and a `payload`.

```typescript
interface WebSocketMessage<T> {
  type: keyof typeof SOCKET_MESSAGE_TYPES;
  payload: T;
}
```

The `type` string identifies the action or event, and is defined in `src/shared/constants/socket.const.ts`.

### System Messages
-   **`ERROR`**: Sent from server to a client when an error occurs.
    -   **Payload**: `{ "message": "string" }`
-   `PING`: Sent from client to server to check connection. (No payload)
-   `PONG`: Sent from server to client in response to a `PING`. (No payload)

### Game Subscription
-   **`GAME_SUBSCRIBE`**: Client message to start receiving updates for a specific game.
    -   **Payload**: `{ "gameId": "string" }` (Can be game UUID or game code)
-   **`GAME_UNSUBSCRIBE`**: Client message to stop receiving updates for a specific game.
    -   **Payload**: `{ "gameId": "string" }`

### Game State Updates (Server-to-Client)

-   **`GAME_STATE_UPDATE`**: This is the primary message for synchronizing game state. The server sends this message in several scenarios:
    -   To a single player when they subscribe or reconnect, showing them the latest state.
    -   To a single player after they perform an action (e.g., `GAME_INCREMENT_COUNTER`) to give them instant feedback on their turn's progress.
    -   To all players in a game when a turn ends, broadcasting the official new state.
    -   **Payload (`ClientGameStatePayload`)**:
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
          "mapData": {},
          "gameState": {
            "placeholderCounter": 0
          }
        }
        ```

### Player Actions (Client-to-Server)

-   **`GAME_INCREMENT_COUNTER`**: Client requests to increment the placeholder counter. This action is logged by the server. The server responds by sending a `GAME_STATE_UPDATE` message with a *preview* of the new state back to only the player who sent the action.
    -   **Payload**: `{ "gameId": "string" }`
-   **`GAME_END_TURN`**: Client message to end their current turn. This causes the server to apply all logged actions, calculate the next turn, and broadcast a `GAME_STATE_UPDATE` to all players.
    -   **Payload**: `{ "gameId": "string" }`

### Client-to-Server Messages (Actions)

These are messages sent from the client to the server to perform an action.

*(Examples will be added here as features are developed)*

-   **`JOIN_GAME`**: Client requests to join a specific game room.
-   **`PLAYER_ACTION`**: Client performs a game action (e.g., move unit, cast spell).

### Server-to-Client Messages (Events)

These are messages sent from the server to the client(s) to notify them of state changes.

-   **`PLAYER_JOINED`**: Notifies clients that a new player has joined the lobby. 