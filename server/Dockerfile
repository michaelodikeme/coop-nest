# -------- Development stage --------
FROM node:20-alpine AS development

WORKDIR /app

# Install system dependencies for Prisma, bcrypt, etc.
RUN apk add --no-cache openssl libc6-compat

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

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built server from builder
COPY --from=builder /app/dist ./dist

# Copy Prisma client and schema from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Start the app
CMD ["node", "dist/main.js"]
