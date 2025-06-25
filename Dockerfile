FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Install PostgreSQL client
RUN apk add --no-cache postgresql-client

# Copy root package files
COPY package*.json ./

# Copy server and client package files
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install all dependencies from root package file
RUN npm install

# Install server dependencies
RUN cd server && npm install

# Install client dependencies
RUN cd client && npm install next react react-dom --save

# Copy all source files
COPY . .

# Expose ports for the server and client
EXPOSE 3000 5000 5555

# Copy the start script to the working directory
COPY start.sh ./
RUN chmod +x start.sh  # Ensure the script is executable

# Run migrations, restore db, and start app at container startup
CMD ["./start.sh"]