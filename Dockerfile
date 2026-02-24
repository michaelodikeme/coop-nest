# Multi-stage Dockerfile for optimized production image
# Runs both server and client in a single container with minimal size

# ============================================
# Stage 1: Build Server
# ============================================
FROM node:20-alpine AS server-builder

WORKDIR /app/server

# Configure npm for better network reliability
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000

# Copy server package files
COPY server/package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm install

# Copy server source files and prisma schema
COPY server/ ./

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript server
RUN npm run build

# ============================================
# Stage 2: Build Client
# ============================================
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Configure npm for better network reliability
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000

# Copy client package files
COPY client/package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm install --legacy-peer-deps

# Build arguments for client environment
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy client source files
COPY client/ ./

# Build Next.js client for production
RUN npm run build

# ============================================
# Stage 3: Production Runtime
# ============================================
FROM node:20-alpine

WORKDIR /app

# Install runtime system dependencies only
RUN apk add --no-cache postgresql-client openssl libc6-compat

# Copy root package.json if needed
COPY package*.json ./

# Install root dependencies (if any) - production only
RUN if [ -f package.json ]; then npm install --production; fi

# Copy built server from builder stage
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY --from=server-builder /app/server/package*.json ./server/
COPY --from=server-builder /app/server/prisma ./server/prisma

# Copy built client from builder stage
COPY --from=client-builder /app/client/.next ./client/.next
COPY --from=client-builder /app/client/node_modules ./client/node_modules
COPY --from=client-builder /app/client/package*.json ./client/
COPY --from=client-builder /app/client/public ./client/public
COPY --from=client-builder /app/client/next.config.ts ./client/

# Copy startup script
COPY start.sh ./
RUN chmod +x start.sh

# Expose ports for server and client
EXPOSE 3000 5000

# Set production environment
ENV NODE_ENV=production

# Run migrations and start both services
CMD ["./start.sh"]
