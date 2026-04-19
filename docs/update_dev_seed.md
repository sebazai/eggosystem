# Exporting Dev Seed

phpMyAdmin -> Operations -> Drop -> Create `kanaliiga` and import the dev/test seed.

Do your thing.

phpMyAdmin -> Export

- REMOVE: Display comments (includes info such as export timestamp, PHP version, and server version)
- REMOVE: Enclose in transaction
- ADD: Disable foreign key check.
- REMOVE: Enclose table and column names with back-quotes (Protects column and table names formed with special characters or keywords)

- Export
- Save to `apps/backend/seeds/dev/kana_dev_test_seed.sql` (overwrites the file loaded by `dev_seed.ts` / `e2e_test_seed.ts`)
