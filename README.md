# Kanaliiga Kanahub

Eggosystem for Kanaliiga Hub

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

Run specific test, example run leaderboards backend tests:

- pnpm --filter=backend test -- leaderboards

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

## Database Backups

The system is configured to automatically create daily database backups at 04:00 using a rotating schedule based on weekdays. Backups are stored in the `./db-backup/` directory with filenames following the pattern `backup-[weekday].sql` (e.g., `backup-Mon.sql`, `backup-Tue.sql`, etc.).

### Backup Features:

- Automated daily backups at 04:00
- Rotating backup files by weekday (7-day retention)
- Backup logs stored in `./db-backup/backup.log`
- All database contents included in each backup

### Manual Backup

To manually trigger a backup:

```bash
docker-compose exec eggo-db-backup /backup.sh
```

### Restoring from Backup

To restore from a backup file:

```bash
# Replace [weekday] with the day you want to restore from (Mon, Tue, Wed, etc.)
cat ./db-backup/backup-[weekday].sql | docker-compose exec -T eggo-prod-db mysql -u root -p[root_password]
```

Note: Replace `[root_password]` with your actual database root password.
