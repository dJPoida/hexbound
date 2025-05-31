A Polytopia / Civ / Populous crossover Asynchronous turn-based casual web game.

## Local Development

This project uses Vite for the frontend and Vercel CLI for emulating serverless functions locally.

### Prerequisites

1.  Node.js and npm (or your preferred package manager).
2.  Vercel CLI: Install it globally if you haven't already:
    ```bash
    npm install -g vercel
    ```

### Running the Application

1.  Install project dependencies:
    ```bash
    npm install
    ```
2.  Start the development servers (frontend and backend):
    ```bash
    npm run dev
    ```
    This command concurrently runs:
    *   The Vite development server (for the frontend, usually on a port like `http://localhost:5173`).
    *   The Vercel development server (`vercel dev`) for the serverless functions (API endpoints, on `http://localhost:3000`).

The Vite server is configured to proxy requests from `/api` to the Vercel server.

After running `npm run dev`, open the frontend URL (provided by Vite in the console) in your browser to view the application.