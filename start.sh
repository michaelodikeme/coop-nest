#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting Coop Nest Application in PRODUCTION mode..."

# 1. Generate Prisma Client (ensures types are up to date)
echo "Regenerating Prisma Client..."
cd /app/server
npx prisma generate

# 2. Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# 3. Build the Express server (compile TypeScript)
echo "Building Express server..."
npm run build

# 4. Start the Express server in background (production mode - uses compiled JS)
echo "Starting Express server on port 5000 (production mode)..."
npm start &
SERVER_PID=$!

# Give the server time to initialize
sleep 5

# 5. Build the Next.js client (compile for production)
echo "Building Next.js client..."
cd /app/client
npm run build

# 6. Start the Next.js client in production mode
echo "Starting Next.js client on port 3000 (production mode)..."
npm run start &
CLIENT_PID=$!

echo "Both services are running in PRODUCTION mode!"
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
