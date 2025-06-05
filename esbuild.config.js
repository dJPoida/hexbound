import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['src/server/main.ts'],
  outfile: 'dist/server/main.js',
  bundle: true,
  platform: 'node',
  target: 'node18', // Match your Dockerfile Node version
  format: 'cjs', // Output CommonJS
  sourcemap: true,
  packages: 'external', // Keep node_modules external
  tsconfig: 'tsconfig.json', // Use settings from tsconfig.json
  banner: {
    // Add __dirname and __filename shims for CJS if needed when format is 'esm'
    // js: "import { dirname as __pathDirname } from 'path'; import { fileURLToPath as __fileURLToPath } from 'url'; const __filename = __fileURLToPath(import.meta.url); const __dirname = __pathDirname(__filename);",
  },
}).catch(() => process.exit(1)); 