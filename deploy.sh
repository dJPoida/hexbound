#!/bin/bash
# A script to deploy the hexbound application on the server.

# --- Pull the latest changes from the repository ---
echo "--- Puling the latest changes from the repository ---"
git pull

# --- Pre-Deployment Safety Checks ---
ENV_FILE=".env.prod"
echo "--- Running Pre-Deployment Checks ---"

# 1. Check if the production environment file exists.
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: Production environment file not found at '$ENV_FILE'."
    echo "Please create it from the .env.example template and configure it."
    exit 1
fi

# 2. Check that the database password has been set and is not a default placeholder.
# We check for the specific placeholder text and also for an empty value.
if grep -q "POSTGRES_PASSWORD=your_super_secret_password" "$ENV_FILE" || grep -q "POSTGRES_PASSWORD=your_real_production_password" "$ENV_FILE" || ! grep -q "POSTGRES_PASSWORD=.*" "$ENV_FILE"; then
    echo "ERROR: Insecure or missing POSTGRES_PASSWORD in '$ENV_FILE'."
    echo "Please set a strong, secure password before deploying."
    exit 1
fi

echo "Checks passed. Proceeding with deployment..."
# --- End of Checks ---

# --- Build the Docker Containers ---
echo "--- Build and Start the Docker Containers ---"
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# --- Deployment complete ---
echo "--- Deployment script finished successfully. ---"
