# -------- Development stage --------
FROM node:20-alpine AS development

WORKDIR /app

# Install system dependencies for Prisma, bcrypt, etc.
RUN apk add --no-cache openssl libc6-compat

# Configure npm for better network reliability
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies for development)
RUN npm install

# Copy prisma schema for generation
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the source code
COPY . .

# Expose port
EXPOSE 5000

# Default command for development
CMD ["npm", "run", "dev"]

# -------- Build stage --------
FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies for Prisma, bcrypt, etc.
RUN apk add --no-cache openssl libc6-compat

# Configure npm for better network reliability
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for build + Prisma)
RUN npm install

# Copy the source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the TypeScript project
RUN npm run build

# -------- Production stage --------
FROM node:20-alpine AS production

WORKDIR /app

# Install system dependencies for Prisma runtime
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./

# Copy node_modules from builder (includes Prisma client)
COPY --from=builder /app/node_modules ./node_modules

# Remove devDependencies to reduce image size (no network needed)
RUN npm prune --omit=dev

# Copy built server from builder
COPY --from=builder /app/dist ./dist

# Copy Prisma schema (Prisma client already in node_modules)
COPY --from=builder /app/prisma ./prisma

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Start the app
CMD ["node", "dist/main.js"]
