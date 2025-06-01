# Stage 1: Build the React application
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

RUN npm run build

# Stage 2: Serve the application with Node.js
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/build ./build
COPY server.js .

EXPOSE 8080

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Use a shell script to start the application
CMD ["sh", "-c", "npm start"] 