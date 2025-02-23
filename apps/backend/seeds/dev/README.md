# Exporting Dev Seed

phpMyAdmin -> Export

Tables, remove all structure. Remove `knex_migrations` and `knex_migrations_lock` data.  
Format specific options: Remove enclose in transaction, add disable foreign key check.
Remove: Enclose table and column names with back-quotes (Protects column and table names formed with special characters or keywords)  
Export it.
