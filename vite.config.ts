import preact from '@preact/preset-vite';
import { defineConfig, type UserConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig((): UserConfig => {
  return {
    root: 'src/client', // Set the root to your client source files
    plugins: [
      preact(),
      VitePWA({
        srcDir: '.', // Relative to the root
        filename: 'sw.ts', // The service worker file
        strategies: 'injectManifest', // We want to control the SW, so we use injectManifest
        injectRegister: false, // We will register the service worker manually
        manifest: {
          name: 'Hexbound',
          short_name: 'Hexbound',
          description: 'An asynchronous web-based strategy game.',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'favicon/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'favicon/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    // Server configuration is handled in expressApp.ts for middleware mode
    // HMR configuration uses environment variables from config
    appType: 'spa', // Explicitly set for SPA behavior
    build: {
      outDir: '../../dist/client', // Output directory for client build
      emptyOutDir: true,
    },
    define: {
      // Expose the app version from package.json to the client-side code
      // npm automatically sets process.env.npm_package_version when running scripts
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version),
    },
  };
});
