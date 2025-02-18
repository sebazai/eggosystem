# How to migrate ebinstats kana table

Migrate ebinstats prod database to your dev env is optional.

**NB!** If you want to run migrations from localhost to docker devdb, you need Mariadb for MacOS

```
brew install mariadb
brew services start mariadb
```

- Export latest kana database from production `https://csadmin.kanaliiga.fi/phpmyadmin/`

- Rename and place it into `apps/backend/dbdump/kanaclean.sql`.

- `docker compose up` - migrations container should migrate all data to the new

- Remove `apps/backend/dbdump/kanaclean.sql`
