#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Set default ports if not provided
SERVER_PORT=${SERVER_PORT:-8081}
CLIENT_PORT=${CLIENT_PORT:-8080}

echo "Starting Coop Nest Application in PRODUCTION mode..."
echo "Server Port: $SERVER_PORT"
echo "Client Port: $CLIENT_PORT"

# 1. Generate Prisma Client (ensures types are up to date)
echo "Regenerating Prisma Client..."
cd /app/server
npx prisma generate

# 2. Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# 3. Start the Express server in background (production mode - uses pre-built JS from Dockerfile)
echo "Starting Express server on port $SERVER_PORT (production mode)..."
PORT=$SERVER_PORT npm start &
SERVER_PID=$!

# Give the server time to initialize
sleep 5

# 4. Start the Next.js client in production mode (uses pre-built code from Dockerfile)
echo "Starting Next.js client on port $CLIENT_PORT (production mode)..."
cd /app/client
PORT=$CLIENT_PORT npm run start &
CLIENT_PID=$!

echo "Both services are running in PRODUCTION mode!"
echo "Express API: http://localhost:$SERVER_PORT"
echo "Next.js App: http://localhost:$CLIENT_PORT"

# Graceful shutdown handler
cleanup() {
    echo "Shutting down services..."
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    exit 0
}

trap cleanup SIGTERM SIGINT

# Wait for background processes to keep the container alive
wait $SERVER_PID $CLIENT_PID
