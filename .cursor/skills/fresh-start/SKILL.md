---
name: fresh-start
description: Complete project reset - clean all caches, reinstall, rebuild, and reseed database
disable-model-invocation: true
---

---

name: fresh-start
description: Complete project reset - clean all caches, reinstall, rebuild, and reseed database

---

Perform a complete fresh start of the project. This is useful when things are broken or you want to start from scratch.

This runs `pnpm fresh` which:

1. Cleans all build artifacts (`pnpm clean`)
2. Removes all `node_modules` directories
3. Removes `.turbo` cache
4. Removes `.pnpm-store` cache
5. Reinstalls all dependencies
6. Rebuilds all packages
7. Resets and seeds the database

**Warning**: This will delete all local caches and require a full rebuild.
