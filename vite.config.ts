import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load all env vars from the root directory, regardless of the VITE_ prefix.
  // This makes them available for the config file itself.
  const env = loadEnv(mode, process.cwd(), '');

  // Use the port from .env.local, with a fallback to 3000
  const hmrPort = env.VITE_DEV_PORT ? parseInt(env.VITE_DEV_PORT, 10) : 3000;

  return {
    root: 'src/client', // Set the root to your client source files
    server: {
      allowedHosts: ['dev.hexbound.game-host.org'],
      hmr: {
        port: hmrPort,
      },
    },
    // server: {  // Server options are handled by Express when in middleware mode
    //   port: 5173, 
    //   proxy: {
    //     '/api': {
    //       target: 'http://localhost:3000',
    //       changeOrigin: true,
    //       secure: false,
    //     },
    //   },
    // },
    appType: 'spa', // Explicitly set for SPA behavior
    build: {
      outDir: '../../dist/client', // Output directory for client build
      emptyOutDir: true,
    },
    define: {
      // Expose the app version from package.json to the client-side code
      // npm automatically sets process.env.npm_package_version when running scripts
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version)
    },
    // appType: 'spa', // Default, but good to be aware of for middlewareMode
  };
}); 