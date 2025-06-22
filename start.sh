#!/bin/sh

# Start the server
cd server
npx prisma migrate dev  # Run migrations
npm run dev &           # Start the server in the background

# Start the client
cd ../client
npm run dev             # Start the client

# Wait for background processes to finish
wait