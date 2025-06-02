# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Set build environment variables
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV REACT_APP_N8N_WEBHOOK_URL=https://aplicativos-n8n.m23la1.easypanel.host
ENV REACT_APP_N8N_API_KEY=your_api_key_here

# Build the app
RUN npm run build

# Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --production --legacy-peer-deps

# Copy build output from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/server.js ./

# Expose port
EXPOSE 8080

# Start the server
CMD ["npm", "start"] 