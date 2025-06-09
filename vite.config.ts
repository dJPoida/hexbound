import { defineConfig, type UserConfig } from 'vite';

export default defineConfig((): UserConfig => {
  return {
    root: 'src/client', // Set the root to your client source files
    server: {
      allowedHosts: ['dev.hexbound.game-host.org'],
    },
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
  };
}); 