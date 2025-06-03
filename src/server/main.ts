import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();

  const viteRoot = path.resolve(__dirname, '../client');

  const vite = await createViteServer({
    root: viteRoot,
    configFile: path.resolve(__dirname, '../../vite.config.ts'),
    server: { 
      middlewareMode: true,
      hmr: true,
    },
    appType: 'spa',
  });

  // Use Vite's middleware BEFORE your own routes
  app.use(vite.middlewares);

  // Your API routes
  app.get('/api/ping', (_req, res) => {
    res.json({ message: 'pong' });
  });

  // SPA fallback: Serve index.html for all other GET requests not handled by Vite or API routes.
  // Vite's middleware should handle serving assets from the publicDir (e.g., /vite.svg)
  // and transformed source files (e.g., /main.ts if main.ts is in src/client).
  // This explicit fallback is for SPA routing, ensuring client-side routes are directed to index.html.
  app.get('*', (req, res, next) => {
    // Check if the request is for an API route or if Vite might handle it (e.g. static asset)
    // A more sophisticated check might be needed if you have many non-SPA backend routes.
    if (req.originalUrl.startsWith('/api')) {
      return next(); // Pass to API routes or 404 if not defined
    }
    // Let Vite handle its specific files like HMR updates or source maps
    if (req.originalUrl.includes('@vite') || req.originalUrl.includes('@fs')) {
        return next();
    }
    // For any other GET request, serve the index.html
    // Vite's root is src/client, and index.html is now at src/client/index.html
    res.sendFile(path.resolve(viteRoot, 'index.html'), (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        res.status(500).end();
      }
    });
  });

  const port = process.env.PORT || 5173;
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log('Vite middleware enabled. Client should be served with HMR.');
  });
}

startServer(); 