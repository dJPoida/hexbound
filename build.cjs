const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const log = (message) => console.log(`\n[Build Script] ${message}`);
const runCommand = (command, stepName) => {
  log(`Starting: ${stepName}`);
  log(`Executing: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' }); // stdio: 'inherit' will show command output in console
    log(`Finished: ${stepName}`);
  } catch (error) {
    console.error(`\n[Build Script] ERROR - Failed step: ${stepName}`);
    // execSync already prints error details due to stdio: 'inherit'
    process.exit(1);
  }
};

log('Initiating Hexbound build process...\n');

// 1. Bump package version
runCommand('npm version patch --no-git-tag-version', 'NPM Version Patch');

// 2. Build server with esbuild
runCommand('node esbuild.config.js', 'Server Build (esbuild)');

// 3. Build client with Vite
runCommand('npx vite build', 'Client Build (Vite)');

// 4. Create dist/server/package.json to specify CommonJS for the server bundle
log('Starting: Create dist/server/package.json');
const distServerDir = path.resolve(__dirname, 'dist/server');
const packageJsonPath = path.join(distServerDir, 'package.json');
const packageJsonContent = { type: 'commonjs' };

try {
  if (!fs.existsSync(distServerDir)) {
    fs.mkdirSync(distServerDir, { recursive: true });
    log(`Created directory: ${distServerDir}`);
  }
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonContent, null, 2)); // Added null, 2 for pretty print
  log(`Created ${packageJsonPath} with content: ${JSON.stringify(packageJsonContent)}`);
  log('Finished: Create dist/server/package.json');
} catch (error) {
  console.error('\n[Build Script] ERROR - Failed step: Create dist/server/package.json');
  console.error(error);
  process.exit(1);
}

log('\nHexbound build process completed successfully!\n'); 