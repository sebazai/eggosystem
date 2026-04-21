---
name: rollback-migration
description: Rollback the last database migration
disable-model-invocation: true
---

---

name: rollback-migration
description: Rollback the last database migration

---

Rollback the most recently applied database migration.

This runs `pnpm migrate:rollback` which undoes the last migration batch.

**Warning**: This will undo schema changes and may cause data loss if the migration has been applied to a database with data.
