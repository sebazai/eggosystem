# How to migrate ebinstats kana

## Locally

### Docker compose

Migrate ebinstats prod database to your env.

1. Export latest kana database from production `https://csadmin.kanaliiga.fi/phpmyadmin/`

2. Run `KANA=true docker compose --profile migrations up`

3. Wait for `migrations` container to start

4. Go to environment phpMyAdmin

   - Create database `kana`
   - Grant `kanadbuser` same privileges as for `kanaliiga` table
   - Import the `kana.sql` table

5. Watch migrations run.

### Devcontainer

1. Export latest kana database from production `https://csadmin.kanaliiga.fi/phpmyadmin/`

2. Check that localhost:8083/kanaliiga table is empty but exists, and permissions ok.

3. Create kana table in phpmyadmin, copy permissions from kanaliiga table.

4. Import the export to `kana` table.

5. Run `KANA=true pnpm migrate`

## Gitlab CI

1. Export latest kana database from production `https://csadmin.kanaliiga.fi/phpmyadmin/`

2. Ensure CI/CD variable `KANA`=true

3. Wait for `migrations` container to start in portainer.

4. Go to environment phpMyAdmin

   - Create database `kana`
   - Grant `kanadbuser` same privileges as for `kanaliiga` table
   - Import the `kana.sql` table

5. Watch migrations run.
