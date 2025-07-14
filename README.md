A Polytopia / Civ / Populous crossover Asynchronous turn-based casual web game.

🌏 Server URL: **TEMPORARILY REDACTED**

## Built With

- **TypeScript**: For robust, type-safe code across frontend and backend.
- **Node.js & Express**: For the backend server and RESTful API.
- **Preact & htm**: For lightweight, efficient frontend components with JSX-like syntax.
- **PixiJS**: For high-performance 2D WebGL rendering of the hex grid game map.
- **Vite**: For fast frontend development with Hot Module Reloading (HMR).
- **TypeORM**: For database ORM and migration management with PostgreSQL.
- **Redis**: For in-memory game state storage and session management.
- **Docker & Docker Compose**: For containerized development and deployment.
- **Context API**: For centralized state management across the application.

## Design System

The application uses a comprehensive design system built on:

- **CSS Modules**: Component-scoped styling with shared design tokens
- **Design Tokens**: Centralized color, typography, and spacing variables in `src/client/tokens.module.css`
- **4-Tier Color System**: Base, light, dark, and highlight variants for consistent depth effects
- **SVG Button Components**: Custom gem-style buttons with layered SVG lighting effects
- **Responsive Layout**: Mobile-first design with breakpoints for tablet (768px) and desktop (1024px)
- **Medieval/Fantasy Theme**: Consistent visual aesthetics throughout the application

## Architecture Overview

![Architecture Diagram](/design/architecture.drawio.png)

### Application Structure

```
Frontend: Preact + TypeScript + PixiJS
├── Context Providers (Auth, Game, Navigation, Dialogs, Notifications)
├── Unified Router (Single-source routing with header management)
├── Component Architecture
│   ├── views/ (Page-level components: LobbyView, GameView, etc.)
│   ├── game/ (Game-specific components and dialogs)
│   ├── ui/ (Reusable UI components with design system)
│   └── framework/ (Core app infrastructure)
└── Services (API, Auth, Socket, Rendering, Push)

Backend: Node.js + Express + TypeORM
├── RESTful API endpoints
├── WebSocket server for real-time communication
├── Database layers (PostgreSQL + Redis)
└── Authentication and game logic controllers
```

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have the following software installed:

- **Node.js** (v18 or later is recommended)
- **Docker and Docker Compose**

### Installation & Setup

1.  **Clone the repository**

    ```sh
    git clone https://github.com/your_username/your_repository.git
    cd hexbound
    ```

2.  **Install NPM packages**

    ```sh
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env.local` file by copying the provided example:

    ```sh
    cp .env.example .env.local
    ```

    The default values in `.env.example` are configured to work with the Docker setup out-of-the-box.

    **Note on VAPID Keys for Push Notifications:**
    The `.env.local` file requires VAPID keys for sending web push notifications. For local development, you can use the example keys provided in `.env.example`. For production, you **must** generate your own secure keys:

    ```sh
    npx web-push generate-vapid-keys
    ```

    Then update the `VITE_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` variables in your production environment.

## Development Workflow

### 1. Start Background Services

Start PostgreSQL and Redis containers:

```sh
npm run docker:up
```

### 2. Run Database Migrations

Set up the database schema (required on first run and after schema changes):

```sh
npm run typeorm:run
```

### 3. Start Development Server

Launch the Node.js server with Vite middleware for frontend development:

```sh
npm run dev
```

The application will be available at **[http://localhost:3000](http://localhost:3000)**

This command provides:

- **Hot Module Reloading (HMR)** for instant frontend updates
- **TypeScript compilation** for both frontend and backend
- **WebSocket server** for real-time game communication
- **Express API server** for backend functionality

### 4. Additional Development Commands

```sh
# Stop Docker services
npm run docker:down

# Build for production
npm run build

# Run production build
npm run preview

# Update icon font (after IcoMoon changes)
npm run update:icons

# Generate TypeORM migration
npm run typeorm:generate -- src/server/migrations/MigrationName

# Run TypeScript linter
npm run lint
```

## Database Tools

### Redis (via Redis Commander)

Explore the Redis database at **[http://localhost:8081](http://localhost:8081)** when Docker containers are running.

### PostgreSQL (via Adminer)

Access the PostgreSQL database at **[http://localhost:8080](http://localhost:8080)** with these credentials:

- **System**: `PostgreSQL`
- **Server**: `postgres`
- **Username**: Value from `POSTGRES_USER` in `.env.local`
- **Password**: Value from `POSTGRES_PASSWORD` in `.env.local`
- **Database**: Value from `POSTGRES_DB` in `.env.local`

## Project Structure

```
hexbound/
├── src/
│   ├── client/                 # Frontend application
│   │   ├── components/
│   │   │   ├── views/         # Page-level components
│   │   │   ├── game/          # Game-specific components
│   │   │   ├── ui/            # Reusable UI components
│   │   │   └── framework/     # Core app infrastructure
│   │   ├── contexts/          # React Context providers
│   │   ├── services/          # API and utility services
│   │   ├── rendering/         # PixiJS rendering engine
│   │   └── tokens.module.css  # Design system tokens
│   ├── server/                # Backend application
│   │   ├── routes/           # API route definitions
│   │   ├── controllers/      # Request handlers
│   │   ├── entities/         # TypeORM database models
│   │   ├── migrations/       # Database schema changes
│   │   └── services/         # Business logic services
│   └── shared/               # Code shared between client/server
│       ├── types/           # TypeScript interfaces
│       ├── constants/       # Application constants
│       └── helpers/         # Utility functions
├── design/                   # Design assets and documentation
├── docs/                     # Game design documentation
└── docker-compose.yml       # Development environment setup
```

## Contributing

This project follows specific architectural patterns and design system guidelines. Please refer to the `.cursorrules` file for detailed development standards including:

- Component organization and naming conventions
- Design token usage and CSS architecture
- Context API patterns for state management
- TypeScript conventions and code quality standards

## Documentation

- **Game Design**: See `/docs/` directory for gameplay mechanics and features
- **API Documentation**: See `/design/communication-protocol.md` for API and WebSocket specifications
- **Architecture**: Detailed technical documentation is maintained in `.cursorrules`
