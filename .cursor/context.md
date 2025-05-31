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

### Persistence Layer
- **Primary Storage**: Upstash Redis (via Vercel integration)
- **Usage**:
  - `game:{id}` → Full game state JSON blob
  - `turnQueue:{id}` → Redis list of player IDs in turn order
  - `subscription:{playerId}` → Web Push subscription data
- **Reasoning**: Fast, serverless-friendly, low latency. Ideal for storing async multiplayer state with minimal cost.

### Notification Model
- **Push Technology**: Web Push API using service workers
- **Triggering Events**: When a player ends their turn, a Vercel serverless function sends a push notification to the next player
- **Library**: `web-push` Node package for VAPID key management and delivery
- **Fallback**: Smart polling may still be used if push registration fails

## Local Development Setup

### Frontend Development Tooling
- **Tool**: Vite
- **Reasoning**:
  - Fast builds and dependency caching
  - Excellent Hot Module Reloading (HMR) support
  - First-class TypeScript support
  - Works well with modular code and PixiJS rendering

### Backend Emulation
- **Tool**: Vercel CLI (`vercel dev`)
- **Reasoning**:
  - Accurately emulates Vercel serverless function behavior
  - Supports `/api/*.ts` functions locally without deployment
  - Handles environment variable emulation via `.env.local`

### Combined Workflow
- **Approach**: Run `vite` and `vercel dev` concurrently
- **Proxy Setup**:
  - Vite proxies `/api` routes to `http://localhost:3000` where Vercel dev is running
- **Benefit**:
  - Get Vite’s lightning-fast frontend reload + accurate backend behavior during development

### Dev Commands
- Run backend: `vercel dev`
- Run frontend: `vite`
- Combined (optional): Use `npm-run-all` or `concurrently` to run both

# AI Usage
- Refactor and simplify UI components
- Generate boilerplate logic for turn handling or animation loops
- Write documentation and user onboarding flows
- Design alternate UI/UX layouts or game ideas using natural language prompts
- Recommend next steps

# Coding Conventions
- Use functional, composable modules
- Prefer hooks (if using Preact or similar)
- Use TypeScript strictly with explicit interfaces
- Organize code by domain (e.g. `/engine`, `/state`, `/api`)
