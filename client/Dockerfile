# -------- Development stage --------
FROM node:20-alpine AS development

WORKDIR /app

# Install system deps required by Next.js / native packages
RUN apk add --no-cache libc6-compat openssl

# Configure npm for better network reliability
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000

# Copy dependency files first for better layer caching
COPY package*.json ./

# Install all dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Next.js dev server port
EXPOSE 3000

# Default command for development
CMD ["npm", "run", "dev"]

# -------- Build stage --------
FROM node:20-alpine AS builder

WORKDIR /app

# Install system deps
RUN apk add --no-cache libc6-compat openssl

# Configure npm for better network reliability
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000

# Copy dependency files
COPY package*.json ./

# Install dependencies (all for build)
RUN npm install --legacy-peer-deps

# Copy app source
COPY . .

# Build Next.js production app
RUN npm run build

# -------- Production stage --------
FROM node:20-alpine AS production

WORKDIR /app

# Install system deps
RUN apk add --no-cache libc6-compat openssl

# Set environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Copy node_modules from builder (no network needed)
COPY --from=builder /app/node_modules ./node_modules

# Remove devDependencies to reduce image size
RUN npm prune --omit=dev

# Copy built Next.js output and necessary files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./

# Expose production port
EXPOSE 3000

# Start Next.js production server
CMD ["npm", "run", "start"]
