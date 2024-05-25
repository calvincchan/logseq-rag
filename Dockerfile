# Use the official Bun image with a tag pointing to "latest"
FROM oven/bun:latest

# Volume for journal files
VOLUME /app/journals

# Set working directory
WORKDIR /app

# Copy package.json and bun.lockb for dependency installation
COPY package*.json bun.lockb ./

# Install dependencies based on bun.lockb
RUN bun install

# Copy all project files (excluding those ignored by .dockerignore)
COPY index.ts LogseqLoader.ts ./

# Expose port (optional, adjust based on your application)
EXPOSE 3000

# Run the application using bun
CMD [ "bun", "run", "index.ts" ]
