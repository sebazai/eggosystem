# Eggosystem

This is the Egg o system for Kanaliiga hub

## Development environment

Open devcontainer, it should run pnpm install automatically so you get the tools too if you need
to install some new packages etc and no need to install npm or anything on your own machine.

It will also start the devdb and phpmyadmin from [docker-compose.yml](docker-compose.yml)

### Other way

`docker compose up`

This will start everything you need (dev database with test seed, backend & frontend, redis, phpmyadmin and will run tests)

- docker compose up

Backend can be accessed from localhost:3001 and frontend from localhost:3000 via browser

## Running tests on devcontainer

### Backend

Run all tests

- pnpm --filter=backend test

Run specific test, example run players tests

- pnpm --filter=backend test players

## Database

Read [docs/database.md](docs/database.md) for understanding DB Schema.

### Migrating ebinstats prod

Note: run the migrations from either (no need to expose database locally)

- docker compose
- inside devcontainer

Read [docs/migration.md](docs/migration.md).

## Other

- Phpmyadmin runs as default with docker compose up, on port :8081 so just open http://localhost:8081 to access db (check passwords etc from [dev.env](dev.env))
