# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install all dependencies (including dev for building)
COPY package*.json ./
# Use npm ci for cleaner, more reproducible builds in CI/CD environments
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Run the build process using the project's build script
# This ensures esbuild is used for the server and dist/server/package.json is created.
RUN node build.cjs

# Stage 2: Setup the production environment
FROM node:20-alpine
WORKDIR /app

# Set Node environment to production
ENV NODE_ENV=production

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the built application from the builder stage
# This assumes 'tsc -p tsconfig.json' outputs server files to 'dist/server'
# and 'vite build' outputs client files to 'dist/client'.
# The entire 'dist' directory from the builder will be copied.
COPY --from=builder /app/dist ./dist

# Copy the entrypoint script
COPY entrypoint.sh .
# Make the entrypoint script executable
RUN chmod +x ./entrypoint.sh

# Expose the port the app will run on.
# Your server config (src/server/config.ts) uses process.env.PORT || '3000'.
EXPOSE 3000

# Set the entrypoint script to be executed when the container starts
ENTRYPOINT ["./entrypoint.sh"]
# Command to run the application, which will be passed to the entrypoint
CMD ["node", "dist/server/main.js"] 