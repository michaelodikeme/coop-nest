FROM node:latest

WORKDIR /app

# Install postgresql-client
RUN apt-get update && apt-get install -y postgresql-client

# Copy root package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy server and client package files and install dependencies
COPY server/package*.json ./server/
RUN cd server && npm install

COPY client/package*.json ./client/
RUN cd client && npm install

# Copy all source files
COPY . .

# Expose ports
EXPOSE 3000 5000

# Run migrations, restore db, and start app at container startup
CMD ["sh", "-c", "cd server && npx prisma migrate deploy --schema=prisma/schema.prisma && npm run restore:db && npm start"]
