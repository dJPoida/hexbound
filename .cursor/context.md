# Project Overview
This game is a hybrid of Civilization, Polytopia, and Populous. It is an asynchronous web-based strategy game using a hex grid and turn-based war mechanics.

# Game Features
- Web-based, mobile-friendly
- Asynchronous multiplayer
- Hexagonal tile grid
- Territory control and combat
- Populous-style god powers (e.g., terraforming)

# Tech Stack

## Game Stack and Architecture Decisions

### Rendering Library
- **Library**: PixiJS
- **Reasoning**: Kaboom.js is no longer maintained. PixiJS offers an actively supported, high-performance 2D WebGL renderer suitable for rendering hex grids and sprite-based elements in a browser. It provides granular rendering control and integrates well with TypeScript.

### Language
- **Primary Language**: TypeScript
- **Reasoning**: Ensures type safety and maintainability. Works seamlessly with modern tooling and the chosen rendering library (PixiJS).

### UI Layer
- **Approach**: DOM-based overlays (menus, HUD, dialogs)
- **Optional Library**: htm or Preact if UI complexity grows
- **Reasoning**: Avoid full-fledged frameworks like React to reduce overhead and improve performance in a game context.

### Backend Server
- **Framework**: Node.js with Express and Vite Dev Server
- **Responsibilities**:
  - Serving static frontend assets (built by Vite).
  - Providing a RESTful API for game logic (state management, turns, player actions).
  - Managing WebSocket connections for real-time bi-directional communication.
- **Usage**: Run inside a terminal for development or runs as a service within the Docker environment for production.
- **Reasoning**: A robust and widely-used framework for building web servers and APIs. TypeScript support is excellent.

### Persistence Layer
- **Primary Storage**: Redis
- **Usage**:
  - `dev:game:{gameId}` or `prod:game:{gameId}` → Full game state (hash)
  - `dev:player:{playerId}` or `prod:player:{playerId}` → Player-specific info like name (hash)
  - `dev:player_games:{playerId}` or `prod:player_games:{playerId}` → Set of gameIds a player is in
  - (Future) `dev:subscription:{playerId}` or `prod:subscription:{playerId}` → Web Push subscription data (string/JSON)
- **Reasoning**: Fast, in-memory data store suitable for session management and frequently changing game state. Runs as a service within the Docker environment.

### Communication Model
- **Notification Technology**: Service workers polling the API managed by the Node.js/Express server and pushing notifications to the browser/device.
- **Real-time Updates**: WebSockets for instant game state synchronization across connected clients via the Node.js server.

## Local Development Setup & Deployment

### Containerization & Orchestration
- **Tools**: Docker & Docker Compose
- **Reasoning**:
  - Provides a consistent development, testing, and production environment.
  - Simplifies setup of the application server and its dependencies (like Redis).
  - Defines the build process for the application via a `Dockerfile`.
  - Manages multi-container setup (app server, Redis) via `docker-compose.yml`.

### Frontend Development Tooling
- **Tool**: Vite (and Vite Dev Server)
- **Reasoning**:
  - Fast builds and dependency caching for the frontend.
  - Excellent Hot Module Reloading (HMR) support
  - First-class TypeScript support.

### Development Workflow
- **Primary Command**: `npm run dev`
  - This command runs the Node.js server which uses Vite to build and serve the front end using HMR
  - The application is typically accessible at `http://localhost:3000`.
  - Server environment variables are loaded from `.env` via `dotenv`.
- **Starting Docker Services**: `npm run docker:up` (which executes `docker-compose up -d`).
  - This ensures that all Dockerised services (typically Redis) are started and available.
- **Stopping Docker Services**: `npm run docker:down` (or `Ctrl+C` then `docker-compose down`).

### Environment Variable Management

Environment variables are managed as follows:

# AI Usage
- Refactor and simplify UI components and game logic.
- Generate boilerplate for new features (e.g., WebSocket handlers, new API endpoints).
- Write documentation and user onboarding flows.
- Design alternate UI/UX layouts or game ideas using natural language prompts.
- Recommend next steps and architectural improvements.
- Only add comments that describe code. Do not add comments that describe AI Agent actions or changes made by AI
- Comments in Preact JS Templated String style components should be made with `<!-- HTML Comment Syntax -->`
- It is possible for the Human to make changes to the code. Don't assume your memory of code is 100% correct.

# Coding Conventions
- Use functional, composable modules where appropriate.
- Prefer clear, well-typed TypeScript code with explicit interfaces.
- Source code exists in `/src` and is separated into `server`, `client` and `shared` domains (shared houses types used across both server and client)
