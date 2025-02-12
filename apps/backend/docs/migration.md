# How to migrate kana table (Optional)

If you wish to migrate ebinstats prod database to your dev env.

If you want to run migrations from localhost to docker devdb, you need Mariadb for MacOS

```
brew install mariadb
brew services start mariadb
```

- Export latest kana database from production

- Rename and place it into `dbdump/kanaclean.sql`.

- `docker compose up --build` - migrations container should migrate all data to the new

- Remove `dbdump/kanaclean.sql`
