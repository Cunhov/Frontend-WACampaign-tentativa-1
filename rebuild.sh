#!/bin/bash

# Stop any running containers
echo "Stopping any running containers..."
docker-compose down

# Remove old build files
echo "Cleaning up old build files..."
rm -rf build/

# Build the React app
echo "Building React app..."
npm run build

# Build and start Docker containers
echo "Building and starting Docker containers..."
docker-compose up --build -d

# Show logs
echo "Showing container logs..."
docker-compose logs -f 