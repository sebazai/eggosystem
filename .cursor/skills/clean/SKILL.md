---
name: clean
description: Clean all build artifacts and caches
disable-model-invocation: true
---

---

name: clean
description: Clean all build artifacts and caches

---

Remove all build artifacts, compiled output, and cache directories.

This runs `pnpm clean` which uses Turbo to clean all workspaces, removing `dist/`, `.next/`, and other build outputs.
