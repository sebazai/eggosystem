---
name: db-reset
description: Reset and reseed the database
---

Reset the database completely and reseed it with development data.

This runs `pnpm reseed` which:

1. Runs the reset seed to drop all tables, triggers, functions, and procedures
2. Runs migrations to recreate the schema
3. Seeds the database with development data

**Warning**: This will delete all data in the database.
