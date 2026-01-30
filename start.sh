# # #!/bin/sh

# # # Start the server
# # cd server
# # npx prisma migrate dev  # Run migrations
# # npm run dev &           # Start the server in the background

# # # Start the client
# # cd ../client
# # npm run dev             # Start the client

# # # Wait for background processes to finish
# # wait

# # ===========

# #!/bin/sh

# # Set working directory
# cd /app

# echo "🚀 Starting Coop Nest Application..."

# # Run database migrations (production-safe)
# echo "📊 Running database migrations..."
# cd /app/server
# npx prisma migrate deploy  # Use 'deploy' for production, not 'dev'
# npx prisma generate

# # Start the Express server on port 5000 in background
# echo "🖥️  Starting Express server on port 5000..."
# cd /app/server
# SERVER_PORT=5000 npm run start &
# SERVER_PID=$!

# # Give server time to start
# sleep 3

# # Start the Next.js client on port 3000 in background
# echo "🌐 Starting Next.js client on port 3000..."
# cd /app/client
# CLIENT_PORT=3000 npm run start &
# CLIENT_PID=$!

# echo "✅ Both services started successfully!"
# echo "📡 Express API: http://localhost:5000"
# echo "🌍 Next.js App: http://localhost:3000"

# # Function to handle shutdown gracefully
# cleanup() {
#     echo "🛑 Shutting down services..."
#     kill $SERVER_PID 2>/dev/null
#     kill $CLIENT_PID 2>/dev/null
#     exit 0
# }

# # Set up signal handlers for graceful shutdown
# trap cleanup SIGTERM SIGINT

# # Wait for both background processes
# wait $SERVER_PID $CLIENT_PID





#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting Coop Nest Application..."

# 1. Generate Prisma Client first (extra safety)
echo "🔨 Regenerating Prisma Client..."
cd /app/server
npx prisma generate

# 2. Run database migrations
# We use 'deploy' for production-like environments to apply pending migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

# 3. Start the Express server
# Using 'npm run dev' if you want nodemon, or 'npm run start' for production
echo "🖥️  Starting Express server on port 5000..."
# We use & to run in background
npm run dev &
SERVER_PID=$!

# Give the server a moment to initialize before starting the client
sleep 5

# 4. Start the Next.js client
echo "🌐 Starting Next.js client on port 3000..."
cd /app/client
npm run start &
CLIENT_PID=$!

echo "✅ Both services are initializing!"
echo "📡 Express API: http://localhost:5000"
echo "🌍 Next.js App: http://localhost:3000"

# Graceful shutdown handler
cleanup() {
    echo "🛑 Shutting down services..."
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    exit 0
}

trap cleanup SIGTERM SIGINT

# Wait for background processes to keep the container alive
wait $SERVER_PID $CLIENT_PID