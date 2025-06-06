import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Determines the directory name of the current module, supporting both ESM and CJS contexts.
 * This is crucial because the server runs in ESM during development (`tsx`) and CJS in production (esbuild bundle).
 *
 * In ESM, `import.meta.url` is available and provides the module's path.
 * In CJS, `__dirname` is available and provides the module's directory path.
 *
 * @param metaUrl - The `import.meta.url` from the calling module. It should be provided ONLY in an ESM context.
 * @returns The directory path of the calling module.
 */
export function getModuleDir(metaUrl?: string): string {
  const isEsModule = metaUrl !== undefined;

  if (isEsModule) {
    // ESM environment (e.g., dev mode with tsx)
    return path.dirname(fileURLToPath(metaUrl!));
  }

  if (typeof __dirname === 'string' && __dirname) {
    // CJS environment (e.g., prod build from esbuild)
    // In the bundled CJS output, __dirname will be correctly set.
    return __dirname;
  }

  // Fallback or error if neither is available
  console.error(
    'CRITICAL: Could not determine module directory. __dirname is not available and import.meta.url was not provided.',
  );
  process.exit(1);
} 