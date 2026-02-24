# Monolithic Dockerfile - runs both server and client in a single container
# Use docker-compose.yml for development (recommended)

FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache postgresql-client openssl libc6-compat

# Copy package files for better layer caching
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Copy all source files
COPY . .

# Generate Prisma Client (requires schema.prisma to be present)
RUN cd server && npx prisma generate

# Build Express server (compile TypeScript)
RUN cd server && npm run build

# Build arguments for client environment
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build Next.js client
RUN cd client && npm run build

# Expose ports for server and client
EXPOSE 3000 5000

# Ensure start script is executable
RUN chmod +x start.sh

# Run migrations and start both services
CMD ["./start.sh"]
