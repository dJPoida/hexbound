import express from 'express';
import path from 'path';
import http from 'http';
import { ViteDevServer } from 'vite';
import { createServer as createViteServer } from 'vite';
import config from './config.js';
import apiRouter from './apiRouter.js';
import { getModuleDir } from '../shared/helpers/getModuleDir.helper.js';

const currentModuleDirname = getModuleDir(
  typeof import.meta?.url === 'string' ? import.meta?.url : undefined,
);

export async function configureExpressApp(
  app: express.Express,
  httpServer: http.Server,
): Promise<{ vite?: ViteDevServer }> {
  // API routes must be registered BEFORE the Vite middleware
  // so they are handled by the backend and not treated as a client-side route.
  app.use('/api', apiRouter);

  if (config.nodeEnv === 'production') {
    console.log('Production mode: serving static files from dist/client');
    const clientBuildDir = path.resolve(currentModuleDirname, '../client');

    // Serve all static files from the client build directory
    app.use(express.static(clientBuildDir));

    // SPA fallback: Serve index.html for all other GET requests that don't match a file
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(clientBuildDir, 'index.html'), (err) => {
        if (err) {
          console.error('Error sending index.html in production:', err);
          res.status(500).end();
        }
      });
    });
    return {};
  } else {
    try {
      console.log('Development mode: configuring Vite middleware.');
      const viteRoot = path.resolve(currentModuleDirname, '../client');
      const vite = await createViteServer({
        root: viteRoot,
        configFile: path.resolve(currentModuleDirname, '../../vite.config.ts'),
        server: {
          middlewareMode: true,
          hmr: {
            server: httpServer, // Pass the http server instance here
          },
        },
        appType: 'spa',
      });

      // Use vite's connect instance as middleware.
      // This will handle HMR and serve client-side assets.
      app.use(vite.middlewares);
      return { vite };
    } catch (e) {
      console.error('[Vite] Error during middleware configuration:', e);
      // Re-throw the error to be handled by the calling function
      throw e;
    }
  }
} 