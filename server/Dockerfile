FROM node:alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# Install postgresql-client
# RUN apt-get update && apt-get install -y postgresql-client
# RUN apk add --no-cache postgresql-client

COPY . .

EXPOSE 5000

CMD [ "npm", "run", "dev" ]