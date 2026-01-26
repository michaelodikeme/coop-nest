# FROM node:alpine

# WORKDIR /app

# COPY package*.json ./

# RUN npm install

# # Install postgresql-client
# # RUN apt-get update && apt-get install -y postgresql-client
# # RUN apk add --no-cache postgresql-client

# COPY . .

# EXPOSE 5000

# CMD [ "npm", "run", "dev" ]

FROM node:20-alpine

WORKDIR /app

# Install system dependencies (needed by Prisma, bcrypt, etc.)
RUN apk add --no-cache openssl libc6-compat

# Copy only dependency files first (better caching)
COPY package*.json ./

# Install dependencies safely
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy the rest of the app
COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]
