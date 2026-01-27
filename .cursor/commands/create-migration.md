---
name: create-migration
description: Create a new database migration
---

Create a new database migration file. You'll be prompted for the migration name.

This runs `pnpm migrate:make <name>` which creates a new migration file in `apps/backend/migrations/` with the current timestamp.

Example: "create-migration add_user_preferences_table"
