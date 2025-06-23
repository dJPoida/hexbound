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
-   **`POST /subscribe-push`**: Subscribes a user to receive push notifications.
    -   **Authentication**: Required (Session Token)
    -   **Request Body**: Standard PushSubscription JSON object from the browser.
    -   **Response (201 Created)**: `{ "message": "Successfully subscribed to push notifications." }`

#### Games (`/games`)

*These endpoints require an authenticated user.*

-   **`GET /`**: Fetches a list of games for the authenticated user.
    -   **Response (200 OK)**: `Array<Game & { currentPlayerId: string | null }>`
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
            },
            "currentTurn": 1,
            "currentPlayerId": "string (uuid) | null"
          }
        ]
        ```
-   **`POST /`**: Creates a new game.
    -   **Request Body**: (None)
    -   **Response (201 Created)**:
        ```json
        {
          "message": "Game created successfully",
          "gameId": "string",
          "gameCode": "string"
        }
        ```
-   **`GET /by-code/:gameCode`**: Fetches a single game's details by its code.
    -   **Response (200 OK)**: `GameEntity` (similar to the objects in the `GET /` array).
-   **`POST /:gameCode/join`**: Allows the authenticated user to join a game.
    -   **Response (200 OK)**: `{ "message": "Successfully joined game.", "gameId": "string" }`

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

All WebSocket messages are JSON objects with a `type` and a `payload`. The `type` string identifies the action or event, and is defined in `src/shared/constants/socket.const.ts` using a `feature:action` naming convention.

```typescript
interface WebSocketMessage<T> {
  type: 'feature:action';
  payload: T;
}
```

### System Messages (Server-to-Client)
-   **`error`**: Sent from server to a client when an error occurs.
    -   **Payload**: `{ "message": "string" }`

### Game Lifecycle

A user can join a game in two ways:
1.  **Via REST API**: By calling `POST /api/games/:gameCode/join`.
2.  **Via WebSocket**: By sending a `game:subscribe` message for a game they are not yet a part of. The server will automatically add them if the game has not started.

#### Subscription
-   **`game:subscribe`**: Client message to start receiving updates for a specific game.
    -   **Payload**: `{ "gameId": "string" }` (Can be game UUID or game code)
-   **`game:unsubscribe`**: Client message to stop receiving updates for a specific game.
    -   **Payload**: `{ "gameId": "string" }`

### Game State

The authoritative game state is stored in Redis on the server (`ServerGameState`). This object contains sensitive or internal data like the `turnActionLog`. When the server sends state to clients, it uses a sanitized version called `ClientGameStatePayload`.

-   **`game:state_update` (Server-to-Client)**: This is the primary message for synchronizing game state. The server sends this message:
    -   To a single player when they subscribe or reconnect, showing them the latest state.
    -   To a single player after they perform an action (e.g., `game:increment_counter`) to give them instant feedback (a "preview state").
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

-   **`game:increment_counter`**: Client requests to increment the placeholder counter. This action is logged in the `turnActionLog` in Redis. The server then responds to *only the sender* with a `game:state_update` message containing a preview of the new state.
    -   **Payload**: `{ "gameId": "string" }`
-   **`game:end_turn`**: Client message to end their current turn. This causes the server to apply all logged actions from the `turnActionLog`, calculate the next turn's state, advance the turn, and broadcast a final `game:state_update` to all players. It also triggers a push notification to the next player.
    -   **Payload**: `{ "gameId": "string", "turnId": "string" }`
      *(Note: `turnId` is not currently used by the server but is part of the payload.)*

### Client-to-Server Messages (Actions)

These are messages sent from the client to the server to perform an action.

*(Examples will be added here as features are developed)*

-   **`JOIN_GAME`**: Client requests to join a specific game room.
-   **`PLAYER_ACTION`**: Client performs a game action (e.g., move unit, cast spell).

### Server-to-Client Messages (Events)

These are messages sent from the server to the client(s) to notify them of state changes.

-   **`PLAYER_JOINED`**: Notifies clients that a new player has joined the lobby. 