### Docker Build Commands

#### Build the app image
> `docker buildx build -t coop-nest-app .`

#### Push image to docker.io
- Push Image
> `docker push michaelodikeme/coop-nest:coop-nest-app`

#### Stop and remove containers (hostinger)
> `docker stop coop-nest-container docker-postgres-server docker-redis-server`
> `docker rm coop-nest-container docker-postgres-server docker-redis-server`

##### Remove and remove only app container (hostinger)
> `docker stop coop-nest-container && docker rm coop-nest-container`

#### Pull image from docker.io (hostinger)
- Pull image
> `docker pull michaelodikeme/coop-nest:coop-nest-app`

#### Create docker network (optional)
> `docker network create coop-nest-network`

#### Create docker volume (optional)
> `docker volume create coop-nest-data`

#### Run postgres server with created network (optional, if already created)
```
    docker run \
    --name docker-postgres-server \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=rootuser \
    -e POSTGRES_DB=postgres \
    -p 5432:5432 \
    -d postgres

    docker run \
    --name postgres \
    --network coop-nest-network \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=rootuser \
    -e POSTGRES_DB=postgres \
    -p 5432:5432 \
    -d postgres
```

#### Run redis server with created network (optional, if already created)
```
    docker run \
    --name redis \
    --network coop-nest-network \
    -p 6379:6379 \
    -d redis:alpine
```

#### Run the container with network and app image (hostinger)
```
    docker run \
    --name coop-nest-container \
    --network coop-nest-network \
    -p 5000:5000 \
    -p 3000:3000 \
    coop-nest-app
```
    docker run \
    --name coop-nest-container \
    --network host \
    -e DATABASE_URL=postgresql://postgres:rootuser@localhost:5432/postgres?schema=coop-nest_db \
    -e REDIS_URL=redis://localhost:6379 \
    -e CORS_ORIGINS=http://fuosmcsl.online,http://168.231.116.82:3000 \
    -e APPLICATION_URL=http://fuosmcsl.online \
    -e NEXT_PUBLIC_API_URL=http://fuosmcsl.online/api \
    -p 5000:5000 \
    -p 3000:3000 \
    michaelodikeme/coop-nest:coop-nest-app
---

### Docker commands

"deploy:stop-container": "docker stop coop-nest-container || true",
"deploy:remove-container": "docker rm coop-nest-container || true",
"deploy:docker-build": "docker buildx build -t coop-nest-app .",
"deploy:start-container": "docker run --name coop-nest-container --network coop-nest-network -v coop-nest-data:/app/server/backups/db -p 5000:5000 -p 3000:3000 -p 5555:5555 michaelodikeme/coop-nest:coop-nest-app",
"deploy": "npm run deploy:docker-build && npm run deploy:stop-container && npm run deploy:remove-container && npm run deploy:start-container"