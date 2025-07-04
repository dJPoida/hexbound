FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files from docs-site directory
COPY docs-site/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy docs-site source code
COPY docs-site/ ./

# Copy the docs directory that Docusaurus needs (from project root)
COPY docs/ ../docs/

# Build the site
RUN npm run build

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "serve"] 