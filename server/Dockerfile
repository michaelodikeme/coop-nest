# FROM node:alpine

# WORKDIR /app

# COPY package*.json ./

# RUN npm install

# # Install postgresql-client
# # RUN apt-get update && apt-get install -y postgresql-client
# # RUN apk add --no-cache postgresql-client

# COPY . .

# EXPOSE 5000

# CMD [ "npm", "run", "dev" ]

# FROM node:20-alpine

# WORKDIR /app

# # Install system dependencies (needed by Prisma, bcrypt, etc.)
# RUN apk add --no-cache openssl libc6-compat

# # Copy only dependency files first (better caching)
# COPY package*.json ./

# # Install dependencies safely
# RUN npm install --legacy-peer-deps --no-audit --no-fund

# # Copy the rest of the app
# COPY . .

# EXPOSE 5000

# CMD ["npm", "run", "dev"]

# -------- Build stage --------
FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies for Prisma etc
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY server/package*.json ./server/

# Install all dependencies (needed for build + Prisma)
RUN cd server && npm install

# Copy the source code
COPY server ./server

# Generate Prisma client
RUN cd server && npx prisma generate

# If TypeScript, build the project
RUN cd server && npm run build

# -------- Runtime stage --------
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy built server + Prisma client from builder
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules/.prisma ./server/node_modules/.prisma
COPY --from=builder /app/server/prisma ./server/prisma

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Start the app
CMD ["node", "server/dist/main.js"]
