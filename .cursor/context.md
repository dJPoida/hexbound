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
  - Get Vite's lightning-fast frontend reload + accurate backend behavior during development

### Dev Commands
- Run backend: `vercel dev`
- Run frontend: `vite`
- Combined (optional): Use `npm-run-all` or `concurrently` to run both

### Environment Variable Management

Environment variables for this project are managed based on their usage context:

1.  **Serverless Functions (Backend - `api/*` directory):**
    *   All environment variables required by serverless functions (e.g., `REDIS_URL`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, and `VITE_VAPID_PUBLIC_KEY` for server-side push configuration) are primarily defined in the **Vercel Project Settings** on the Vercel dashboard.
    *   These variables should be configured for each relevant environment (Development, Preview, Production) within the Vercel dashboard.
    *   When running `vercel dev` locally, it will fetch and use the variables set for the "Development" environment from the Vercel dashboard.
    *   To maintain a reference in the local codebase, these server-side variables can be listed in `.env.local` but should have their values left blank or set to a placeholder comment (e.g., `VAR_NAME=#DEFINED_IN_VERCEL_DASHBOARD#`) to indicate they are sourced from Vercel during local development with `vercel dev`.
        *Example `.env.local` structure for backend variables managed by Vercel:*
        ```env
        # BACKEND ENVIRONMENT VARIABLES CONFIGURED IN VERCEL DEVELOPMENT/PRODUCTION ENVIRONMENT
        REDIS_URL=
        VAPID_PRIVATE_KEY=
        VAPID_SUBJECT=
        # VITE_VAPID_PUBLIC_KEY= (also used server-side, sourced from Vercel by vercel dev)
        ```

2.  **Frontend Application (Client-Side - `src/*` directory, processed by Vite):**
    *   All environment variables required by the client-side code must be exposed by Vite.
    *   These variables **must be defined in the `.env.local` file** (or other `.env.[mode]` files as per Vite's standard .env loading mechanism).
    *   To be exposed to client-side code, these variables **must be prefixed with `VITE_`** (e.g., `VITE_VAPID_PUBLIC_KEY`).
    *   Vite will bundle these `VITE_` prefixed variables from `.env.local` into the frontend application via `import.meta.env`.
        *Example `.env.local` for a frontend variable:*
        ```env
        # FRONTEND ENVIRONMENT VARIABLES EXPOSED BY VITE
        VITE_VAPID_PUBLIC_KEY=your_actual_public_vapid_key_value
        ```

This strategy ensures that secrets and server-side configurations are managed securely within Vercel, while client-side configurations are handled via Vite's standard mechanisms. `vercel dev` prioritizes variables from the Vercel dashboard for the "Development" environment over those in `.env.local` for serverless functions.

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
