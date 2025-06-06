A Polytopia / Civ / Populous crossover Asynchronous turn-based casual web game.

🌏 Server URL: **TEMPORARILY REDACTED**

## Architecture Overview

![Architecture Diagram](/design/architecture.drawio.png) (Note: This diagram might need an update to reflect the Dockerized Node.js server instead of Vercel serverless functions.)

## Environment Variables

To run the application locally, you need to set up environment variables. Create a file named `.env.local` in the root of the project and add the following variables.

This file is loaded by the server during development. In production, these variables should be injected into the Docker container's environment.

### Example `.env.local`

```
# Environment variables for Hexbound local development

# --------------------
# General Application
# --------------------
# The port the Node.js Express server will run on.
PORT=3000

# The port the Vite dev server will use for Hot Module Replacement (HMR).
# In the current setup, this should match PORT because Vite runs in middleware mode.
VITE_DEV_PORT=3000

# --------------------
# Redis Configuration
# --------------------
# The host where the Redis server is running.
REDIS_HOST=localhost

# The port for the Redis server.
REDIS_PORT=6379

# The password for the Redis server (if any). Leave blank if not set.
REDIS_PASSWORD=

# You can optionally provide a full Redis connection URL instead of host/port.
# If REDIS_URL is set, it will be used instead of the other REDIS_* variables.
# REDIS_URL=redis://:password@hostname:port/database_number
REDIS_URL=

# ------------------------
# PostgreSQL Configuration (if used)
# ------------------------
# The host where the PostgreSQL server is running.
POSTGRES_HOST=localhost

# The port for the PostgreSQL server.
POSTGRES_PORT=5432

# The username for the PostgreSQL database.
POSTGRES_USER=your_db_user

# The password for the PostgreSQL database.
POSTGRES_PASSWORD=your_db_password

# The name of the PostgreSQL database.
POSTGRES_DB=hexbound
```

