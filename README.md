# Kanaliiga Kanahub

This is the Eggosystem for Kanaliiga Hub

## Development environment (VSCode)

Open devcontainer (Dev Containers: Open Folder in Container...), it should run pnpm install automatically.

It will also start the devdb and phpmyadmin from [docker-compose.yml](docker-compose.yml).
To run the dev seed, use `pnpm seed` so you get the seeded database for development.

When adding new migrations, rebuild container to run the migrations. Remember to [update the dev/test seed](docs/update_dev_seed.md) when migrations have completed successfully.

Start development env: `pnpm dev` - builds `packages/types` automatically

### Other way

`docker compose up`

This will start everything you need (dev database, backend & frontend, redis, phpmyadmin and will run tests)

- docker compose --profile seed up

Backend can be accessed from localhost:3001 and frontend from localhost:3000 via browser

## Running tests on devcontainer

Run all tests:

- pnpm test

Run specific test, example run players tests:

- pnpm test players

Run backend tests:

- pnpm --filter=backend test

Run frontend tests:

- pnpm --filter=frontend test

## Database

Read [docs/database.md](docs/database.md) for better understanding of the DB Schema.

### Migrating ebinstats prod

Note: run the migrations from either (no need to expose database locally)

- docker compose
- inside devcontainer

Read [docs/migration.md](docs/migration.md).

## Other

- With `docker compose up`, Phpmyadmin runs on port localhost:8082
- With `devcontainer`, Phpmyadmin runs on port localhost:8083

root / dev-pass
