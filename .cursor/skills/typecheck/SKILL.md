---
name: typecheck
description: Run TypeScript type checking across the entire project
disable-model-invocation: true
---

---

name: typecheck
description: Run TypeScript type checking across the entire project

---

Check for TypeScript type errors across all packages and apps in the monorepo.

This runs `pnpm typecheck` which uses Turbo to run type checking in parallel across all workspaces.
