# Multi-stage Dockerfile for Node.js TypeScript backend
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for node-gyp and native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN yarn build

# Stage 2: Production stage
FROM node:18-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S navify -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --frozen-lockfile --production && \
    yarn cache clean

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy any other necessary files
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/drizzle ./drizzle

# Change ownership to app user
RUN chown -R navify:nodejs /app
USER navify

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/health', (r) => { r.statusCode === 200 ? process.exit(0) : process.exit(1) })"

# Start the application
CMD ["node", "dist/index.js"]
