# FROM node:alpine

# WORKDIR /app

# COPY package*.json ./

# RUN npm install

# COPY . .

# EXPOSE 3000

# CMD [ "npm", "run", "dev" ]

# FROM node:20-alpine

# WORKDIR /app

# # System deps required by Next / native packages
# RUN apk add --no-cache \
#   libc6-compat \
#   openssl

# # Copy dependency files first (better cache)
# COPY package*.json ./

# # Avoid npm network issues inside Docker
# RUN npm config set registry https://registry.npmjs.org/ \
#   && npm config set fetch-retries 5 \
#   && npm config set fetch-retry-factor 2 \
#   && npm config set fetch-retry-mintimeout 20000 \
#   && npm config set fetch-retry-maxtimeout 120000

# # Install deps
# RUN npm install --legacy-peer-deps --no-audit --no-fund

# # Copy rest of app
# COPY . .

# # Next dev server port
# EXPOSE 3000

# CMD ["npm", "run", "dev"]

# -------- Build stage --------
FROM node:20-alpine AS builder

WORKDIR /app

# Install system deps
RUN apk add --no-cache libc6-compat openssl

# Copy dependency files
COPY package*.json ./

# Install dependencies (all for build)
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy app source
COPY . .

# Build Next.js production app
RUN npm run build

# -------- Runtime stage --------
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built Next.js output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/package.json ./package.json

# Expose production port
EXPOSE 3000

# Start Next.js production server
CMD ["npm", "run", "start"]
