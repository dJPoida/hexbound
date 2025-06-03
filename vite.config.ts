import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/client', // Set the root to your client source files
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
  // appType: 'spa', // Default, but good to be aware of for middlewareMode
}); 