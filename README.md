# Kanaliiga Kanahub

Eggosystem for Kanaliiga Hub

## Development environment (VSCode)

Open devcontainer (Dev Containers: Open Folder in Container...), it should run pnpm install automatically.

It will also start the devdb and phpmyadmin from [docker-compose.yml](docker-compose.yml).
To run the dev seed, use `pnpm seed` so you get the seeded database for development.

When creating new migrations, remember to [update the dev/test seed](docs/update_dev_seed.md).

Start development env: `pnpm dev` - builds `packages/types` automatically

### JWT Keys

In root run:

```
 openssl genpkey -algorithm RSA -out apps/backend/private_access_token.pem
 openssl rsa -pubout -in apps/backend/private_access_token.pem -out apps/backend/public_access_token.pem
 openssl genpkey -algorithm RSA -out apps/backend/private_refresh_token.pem
 openssl rsa -pubout -in apps/backend/private_refresh_token.pem -out apps/backend/public_refresh_token.pem
```

### Other way

`docker compose up`

This will start everything you need (dev database, backend & frontend, redis, phpmyadmin and will run tests)

```- docker compose --profile seed up```

Backend can be accessed from localhost:3001 and frontend from localhost:3000 via browser

## Running tests on devcontainer

Run all tests:

```- pnpm test```

Run specific test, example run leaderboards backend tests:

```- pnpm --filter=backend test -- leaderboards```

Run backend tests:

```- pnpm --filter=backend test```

Run frontend tests:

```- pnpm --filter=frontend test```


For running e2e tests do
```
pnpm --filter=backend seed:e2e
pnpm --filter=backend dev:e2e &
pnpm exec playwright install
pnpm exec playwright install-deps
pnpm --filter=frontend test:e2e
```

to revert the e2e seed do
```
pnpm --filter=backend reseed
pnpm --filter=backend seed
```


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

The system is configured to automatically create daily database backups at 04:00 using the databack/mysql-backup image. Backups are stored in the `./db-backup/` directory and are automatically cleaned up after 7 days.

### Backup Features:

- Automated daily backups at 04:00
- Gzip compression for reduced storage needs
- 7-day retention period (old backups automatically removed)
- Entire database dumped for easy restoration

### Backup File Format

Backup files are stored with the naming format: `db_backup_YYYY-MM-DDTHH:mm:ssZ.sql.gz`

### Manual Backup

To manually trigger a backup:

```bash
docker-compose exec eggo-db-backup /bin/bash -c 'mysql-backup dump --server $DB_SERVER --user $DB_USER --pass $DB_PASS --target $DB_DUMP_TARGET'
```

### Restoring from Backup

To restore from a backup file:

```bash
# Navigate to the backup directory
cd ./db-backup

# Find the backup file you want to restore
ls -la

# Restore the backup (example for a specific file)
zcat db_backup_YYYY-MM-DDTHH:mm:ssZ.sql.gz | docker-compose exec -T eggo-prod-db mysql -uroot -p${MARIADB_ROOT_PASSWORD}
```

For more information about the backup container, see [databack/mysql-backup](https://github.com/databacker/mysql-backup).
