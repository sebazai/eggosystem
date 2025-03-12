# Exporting Dev Seed

phpMyAdmin -> Export

- REMOVE: Display comments (includes info such as export timestamp, PHP version, and server version)
- REMOVE: Enclose in transaction
- ADD: Disable foreign key check.
- REMOVE: Enclose table and column names with back-quotes (Protects column and table names formed with special characters or keywords)

- Export
- Save to ./kana_dev_test_seed.sql
