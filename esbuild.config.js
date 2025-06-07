import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['src/server/main.ts', 'src/server/data-source.ts', 'src/server/migrations/*.ts'],
  outdir: 'dist/server',
  bundle: true,
  platform: 'node',
  target: 'node20', // Match your Dockerfile Node version
  format: 'cjs', // Output CommonJS
  sourcemap: true,
  packages: 'external', // Keep node_modules external
  tsconfig: 'tsconfig.json', // Use settings from tsconfig.json
  define: {
    // For CJS build context, define import.meta as undefined.
    // This should make the conditional block using import.meta.url
    // (i.e., typeof import.meta !== 'undefined') evaluate to false,
    // effectively making it dead code for the CJS bundle and suppressing warnings.
    'import.meta': 'undefined',
  },
  banner: {
    // Add __dirname and __filename shims for CJS if needed when format is 'esm'
    // js: "import { dirname as __pathDirname } from 'path'; import { fileURLToPath as __fileURLToPath } from 'url'; const __filename = __fileURLToPath(import.meta.url); const __dirname = __pathDirname(__filename);",
  },
}).catch(() => process.exit(1)); 