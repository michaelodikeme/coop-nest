#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting Coop Nest Application..."

# 1. Generate Prisma Client (ensures types are up to date)
echo "Regenerating Prisma Client..."
cd /app/server
npx prisma generate

# 2. Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# 3. Start the Express server in background
echo "Starting Express server on port 5000..."
npm run dev &
SERVER_PID=$!

# Give the server time to initialize
sleep 5

# 4. Start the Next.js client in background
echo "Starting Next.js client on port 3000..."
cd /app/client
npm run start &
CLIENT_PID=$!

echo "Both services are initializing!"
echo "Express API: http://localhost:5000"
echo "Next.js App: http://localhost:3000"

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
