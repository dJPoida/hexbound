# Stage 1: Build the frontend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Setup the production environment
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
# Install production dependencies only
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
# COPY ./api ./api # This is no longer needed as TS code is in src-server and compiled

# We will manage env vars more robustly later
COPY .env.local ./.env
# Expose the port the app will run on
EXPOSE 8080
CMD ["node", "dist-server/server.js"] 