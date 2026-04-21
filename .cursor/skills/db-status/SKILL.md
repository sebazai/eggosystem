---
name: db-status
description: Check database migration status
disable-model-invocation: true
---

---

name: db-status
description: Check database migration status

---

Check the current status of database migrations to see which migrations have been applied and which are pending.

This runs `pnpm migrate:status` which uses Knex to show migration status.
