# Communication Protocol

This document defines the communication contract between the Hexbound client and
server. This includes the RESTful API for administrative actions, the WebSocket
protocol for real-time gameplay, and service worker update handling.

## 1. RESTful API

The REST API is used for actions that don't require real-time, bi-directional
communication, such as user authentication, game creation, and fetching game
lists.

### Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-production-domain.com/api`

### API Endpoints

All API endpoints are prefixed with `/api`. The routes are organized by feature.

#### User (`/user`)

- **`POST /login`**: Logs in or registers a new user.
  - **Request Body**: `{ "userName": "string" }`
  - **Response (200 OK)**:
    ```json
    {
      "userId": "string",
      "userName": "string",
      "sessionToken": "string"
    }
    ```
- **`POST /subscribe-push`**: Subscribes a user to receive push notifications.
  - **Authentication**: Required (Session Token)
  - **Request Body**: Standard PushSubscription JSON object from the browser.
  - **Response (201 Created)**:
    `{ "message": "Successfully subscribed to push notifications." }`
- **`POST /unsubscribe-push`**: Unsubscribes a user from push notifications.
  - **Authentication**: Required (Session Token)
  - **Request Body**: `{ "endpoint": "string" }`
  - **Response (200 OK)**:
    `{ "message": "Successfully unsubscribed from push notifications." }`

#### Games (`/games`)

_These endpoints require an authenticated user._

- **`GET /`**: Fetches a list of games for the authenticated user.
  - **Response (200 OK)**: `Array<Game & { currentPlayerId: string | null }>`
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
- **`POST /`**: Creates a new game.
  - **Request Body**: (None)
  - **Response (201 Created)**:
    ```json
    {
      "message": "Game created successfully",
      "gameId": "string",
      "gameCode": "string"
    }
    ```
- **`GET /by-code/:gameCode`**: Fetches a single game's details by its code.
  - **Response (200 OK)**: `GameEntity` (similar to the objects in the `GET /`
    array).
- **`POST /:gameCode/join`**: Allows the authenticated user to join a game.
  - **Response (200 OK)**:
    `{ "message": "Successfully joined game.", "gameId": "string" }`

#### Misc (`/misc`)

- **`GET /version`**: Returns the application version.
- **`GET /ping`**: A simple health check endpoint.
- **`GET /redis-test`**: Tests the connection to the Redis server.

#### Utils (`/utils`)

_These endpoints require an authenticated user and should be used with caution._

- **`POST /reset-game-data`**: Resets all game data.

**Example: Create Game**

- **Endpoint**: `POST /api/games`
- **Description**: Creates a new game lobby.
- **Request Body**:
  ```json
  {
    "gameName": "My Awesome Game"
  }
  ```
- **Response**:
  ```json
  {
    "gameId": "unique-game-id",
    "gameCode": "ABCD"
  }
  ```

## 2. WebSocket Communication

WebSockets are used for real-time gameplay communication, ensuring that all
players have a synchronized view of the game state.

### Connection

The client establishes a WebSocket connection to the server. Once connected, it
can send and receive messages.

### Message Format

All WebSocket messages are JSON objects with a `type` and a `payload`. The
`type` string identifies the action or event, and is defined in
`src/shared/constants/socket.const.ts` using a `feature:action` naming
convention.

```typescript
interface WebSocketMessage<T> {
  type: 'feature:action';
  payload: T;
}
```

### System Messages (Server-to-Client)

- **`error`**: Sent from server to a client when an error occurs.
  - **Payload**: `{ "message": "string" }`

### Game Lifecycle

A user can join a game in two ways:

1.  **Via REST API**: By calling `POST /api/games/:gameCode/join`.
2.  **Via WebSocket**: By sending a `game:subscribe` message for a game they are
    not yet a part of. The server will automatically add them if the game has
    not started.

#### Subscription

- **`game:subscribe`**: Client message to start receiving updates for a specific
  game.
  - **Payload**: `{ "gameId": "string" }` (Can be game UUID or game code)
- **`game:unsubscribe`**: Client message to stop receiving updates for a
  specific game.
  - **Payload**: `{ "gameId": "string" }`

### Game State

The authoritative game state is stored in Redis on the server
(`ServerGameState`). The client receives game state updates through two separate
message types:

#### Game State Updates

- **`game:state_update`**: Contains game state information (players, turn
  number, current player, etc.) but excludes map data
- **Payload**: `ClientGameStatePayload` - Game state without map data

#### Map Data Updates

- **`game:map_update`**: Contains map data and a checksum for change detection
- **Payload**: `MapUpdatePayload` - Map data with checksum
- **Checksum**: A hash of the map data content used for efficient change
  detection

The separation of game state and map data allows for:

- More efficient updates (map data only sent when it changes)
- Better performance (clients can track map changes via checksum)
- Cleaner separation of concerns

## 3. Service Worker Update Handling

The application uses a service worker to provide offline capabilities and handle
application updates gracefully. The update system ensures users can't join games
with outdated code while providing a smooth user experience.

### Update Detection

The service worker automatically detects when a new version is available and
applies it immediately to ensure users always have the latest version.

#### Service Worker Messages

- **`SKIP_WAITING`**: Sent from client to service worker to activate the new
  version immediately
  - **Payload**: `{ "type": "SKIP_WAITING" }`
- **`REFRESH_GAMES`**: Sent from service worker to client to refresh game data
  - **Payload**: `{ "type": "REFRESH_GAMES" }`

### Update Flow

1. **Detection**: Service worker detects new version during activation
2. **Application**: Update is applied immediately without user intervention
3. **Preservation**: Current URL is stored in sessionStorage before refresh
4. **Redirect**: After refresh, user is redirected to their original location

### URL Preservation

To prevent users from losing their intended destination when updates occur:

- **Before Update**: Current URL is stored in `sessionStorage.pendingUpdateUrl`
- **After Update**: Application checks for stored URL and redirects if different
  from current location
- **Cleanup**: Stored URL is removed after successful redirect

### Automatic Updates

The application enforces automatic updates to ensure:

- All users have the latest version of the application
- No compatibility issues between different versions
- Consistent user experience across all clients
- Prevention of users joining games with outdated code

## Data Types

### Player

```typescript
interface Player {
  userId: string;
  userName: string;
  isPlaceholder: boolean; // Indicates if this is a placeholder waiting for a real player
}
```

### Game State

The game state includes all players (both real and placeholder) and their
current status.

## Game Creation Flow

When a game is created:

1. The system automatically creates 2 players: the creator (real) and a
   placeholder
2. The placeholder player has `userId: 'placeholder-player-2'` and
   `userName: 'Waiting for player...'`
3. The game starts with `status: 'waiting'` until all placeholder players are
   replaced
4. The creator can enter the game but cannot end their turn until all players
   are real

## Game Join Flow

When a player joins via game code:

1. The system checks for available placeholder players
2. If a placeholder exists, it gets replaced with the real player's data
3. If no placeholders exist, the join is rejected (game full)
4. When all placeholders are replaced, the game status changes to 'active'

## Turn Management

Players cannot end their turn if:

- It's not their turn (existing rule)
- Any players in the game are placeholders (new rule)

The UI reflects this by:

- Showing "Waiting for Players" instead of "End Turn"
- Disabling action buttons with appropriate feedback
- Displaying placeholder players in the game state
