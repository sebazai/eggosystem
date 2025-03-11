# How to migrate ebinstats kana table

Migrate ebinstats prod database to your dev env is optional.

- Export latest kana database from production `https://csadmin.kanaliiga.fi/phpmyadmin/`

- Rename and place it into `apps/backend/dbdump/kanaclean.sql`.

- `docker compose up` - migrations container should migrate all data to the new

- Remove `apps/backend/dbdump/kanaclean.sql`
