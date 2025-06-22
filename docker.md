### Docker Build Commands

#### Build the app image
> `docker buildx build -t coop-nest-app .`

#### Create docker network
> `docker network create coop-nest-network`

#### Create docker volume
> `docker volume create coop-nest-data`

#### Run postgres server with created network 
```
    docker run \
    --name docker-postgres-server \
    --network coop-nest-network \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=rootuser \
    -e POSTGRES_DB=postgres \
    -p 5432:5432 \
    -v coop-nest-data:/var/lib/postgresql/data \
    -d postgres
```

#### Run redis server with created network
```
    docker run \
    --name docker-redis-server \
    --network coop-nest-network \
    -p 6379:6379 \
    -v coop-nest-redis-data:/data \
    -d redis:alpine
```

#### Run the container with network and app image
```
    docker run \
    --name coop-nest-container \
    --network coop-nest-network \
    -v coop-nest-data:/app/server/backups/db \
    -p 5000:5000 \
    -p 3000:3000 \
    -p 5555:5555 \
    coop-nest-app
```

#### Stop and remove container
> `docker stop coop-nest-container && docker rm coop-nest-container`
