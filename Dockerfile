#FROM node:20-alpine
#
## Set the working directory
#WORKDIR /app
#
## Install PostgreSQL client
#RUN apk add --no-cache postgresql-client
#
## Copy root package files
#COPY package*.json ./
#
## Copy server and client package files
#COPY server/package*.json ./server/
#COPY client/package*.json ./client/
#
## Install all dependencies from root package file
#RUN npm install
#
## Install server dependencies
#RUN cd server && npm install
#
## Install client dependencies
#RUN cd client && npm install next react react-dom --save
#
## Copy all source files
#COPY . .
#
## Expose ports for the server and client
#EXPOSE 3000 5000 5555
#
## Copy the start script to the working directory
#COPY start.sh ./
#RUN chmod +x start.sh  # Ensure the script is executable
#
## Run migrations, restore db, and start app at container startup
#CMD ["./start.sh"]


# FROM node:20-alpine

# # Set the working directory
# WORKDIR /app

# # Install PostgreSQL client
# RUN apk add --no-cache postgresql-client

# # # Copy root package files
# # COPY package*.json ./

# # # Copy server and client package files
# # COPY server/package*.json ./server/
# # COPY client/package*.json ./client/

# # # Install all dependencies from root package file
# # RUN npm install

# # # Install server dependencies
# # RUN cd server && npm install

# # # Install client dependencies
# # RUN cd client && npm install

# # # Copy all source files
# # COPY . .

# # Copy everything first (so schema.prisma exists)
# COPY . .

# # Install dependencies
# RUN npm install
# RUN cd server && npm install
# RUN cd client && npm install

# # Generate Prisma client AFTER schema is present
# RUN cd server && npx prisma generate

# ARG NEXT_PUBLIC_API_URL
# ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# RUN echo "Building with API_URL: $NEXT_PUBLIC_API_URL"

# # BUILD THE NEXT.JS CLIENT - THIS WAS MISSING!
# RUN cd client && npm run build

# # Expose ports for the server and client
# EXPOSE 3000 5000 5555

# # Copy the start script to the working directory
# COPY start.sh ./
# RUN chmod +x start.sh

# # Run migrations, restore db, and start app at container startup
# CMD ["./start.sh"]

FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache postgresql-client

# Copy package files (leverage Docker cache)
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Copy the rest of the source code
# (Specifically ensures server/prisma/schema.prisma is present)
COPY . .

# IMPORTANT: Generate Prisma Client during build phase
# This ensures TS types exist for ts-node before the container even starts
RUN cd server && npx prisma generate

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build Next.js client
RUN cd client && npm run build

# Expose ports
EXPOSE 3000 5000 5555

# Ensure start script is executable
RUN chmod +x start.sh

CMD ["./start.sh"]