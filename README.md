A Polytopia / Civ / Populous crossover Asynchronous turn-based casual web game.

## Architecture

![Architecture Diagram](/design/architecture.drawio.png)

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
2.  **Start the full local development environment (Vercel Serverless Functions + Vite Frontend):**
    ```bash
    vercel dev
    ```
    This command will:
    *   Start your serverless functions from the `/api` directory (typically accessible via `http://localhost:3000` for API calls).
    *   Execute the frontend development command (`vite`, as defined by the `dev` script in `package.json` and configured in Vercel Project Settings). The Vite server will usually run on a port like `5173` and will be proxied by `vercel dev`.
    *   The main application URL (combining frontend and backend) will be provided by `vercel dev` in the console output (often `http://localhost:3000`).
    *   Load server-side environment variables from your Vercel Project Settings ("Development" environment).
    *   Frontend environment variables (prefixed with `VITE_`) will be loaded from `.env.local` by Vite.

3.  (Optional) To run *only* the Vite frontend development server (e.g., for UI-focused work without starting the Vercel functions environment directly, though API calls will still be proxied if `vercel dev` is also running):
    ```bash
    npm run dev
    ```
    This will start the Vite dev server, typically on `http://localhost:5173`.

After running `vercel dev`, open the main URL provided in your console by `vercel dev` in your browser to view and interact with the application.