A Polytopia / Civ / Populous crossover Asynchronous turn-based casual web game.

🌏 Server URL: **TEMPORARILY REDACTED**

## Built With

*   **TypeScript**: For robust, type-safe code.
*   **Node.js & Express**: For the backend server and API.
*   **Preact & htm**: For lightweight and efficient frontend components.
*   **Vite**: For a fast and modern frontend build process.
*   **TypeORM**: To interact with the PostgreSQL database.
*   **Redis**: For in-memory data storage and caching.
*   **Docker**: For containerizing the application and its services.

## Architecture Overview

![Architecture Diagram](/design/architecture.drawio.png) (Note: This diagram might need an update to reflect the Dockerized Node.js server instead of Vercel serverless functions.)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have the following software installed:
*   Node.js (v18 or later is recommended)
*   Docker and Docker Compose

### Installation & Setup

1.  **Clone the repository**
    ```sh
    git clone https://github.com/your_username/your_repository.git
    ```
2.  **Install NPM packages**
    ```sh
    npm install
    ```
3.  **Set up Environment Variables**
    Create a `.env.local` file by copying the provided example. This file holds all necessary environment variables for local development.
    ```sh
    cp .env.example .env.local
    ```
    The default values in `.env.example` are configured to work with the Docker setup out-of-the-box.

    **Note on VAPID Keys for Push Notifications:**
    The `.env.local` file requires VAPID keys for sending web push notifications. For local development, you can use the example keys provided in `.env.example`. For a production environment, you **must** generate your own secure keys:
    ```sh
    npx web-push generate-vapid-keys
    ```
    Then, update the `VITE_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` variables in your production environment configuration.

## Usage

1.  **Start Background Services**
    This command will start the PostgreSQL and Redis containers in the background.
    ```sh
    npm run docker:up
    ```
2.  **Run the Development Server**
    This command starts the Node.js application with the Vite dev server. It will watch for file changes and automatically reload.
    ```sh
    npm run dev
    ```
    Once the server is running, you can access the application at **[http://localhost:3000](http://localhost:3000)**.

3.  **Run Database Migrations**
    After starting the services and before running the application for the first time, or whenever there are new database schema changes, you need to run the migrations.
    ```sh
    npm run typeorm:run
    ```

### Inspecting the Database

This project's `docker-compose.yml` includes web-based tools for exploring the databases.

#### Redis (via Redis Commander)

To inspect the Redis database, ensure your Docker containers are running (`npm run docker:up`) and navigate to **[http://localhost:8081](http://localhost:8081)** in your web browser.

#### PostgreSQL (via Adminer)

To inspect the PostgreSQL database, navigate to **[http://localhost:8080](http://localhost:8080)**. You can log in using the following credentials, which correspond to the default values in `.env.example`:
-   **System**: `PostgreSQL`
-   **Server**: `postgres` (the service name within Docker's network)
-   **Username**: The value of `POSTGRES_USER` from your `.env.local` file (e.g., `hexbound`)
-   **Password**: The value of `POSTGRES_PASSWORD` from your `.env.local` file
-   **Database**: The value of `POSTGRES_DB` from your `.env.local` file (e.g., `hexbound`)

