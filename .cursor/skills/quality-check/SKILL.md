---
name: quality-check
description: Run all quality gates (knip, typecheck, format:check, lint)
disable-model-invocation: true
---

---

name: quality-check
description: Run all quality gates (knip, typecheck, format:check, lint)

---

Run all quality gates to ensure code meets project standards before committing.

This command runs:

1. `pnpm knip` - Detect unused exports, dependencies, and dead code
2. `pnpm typecheck` - TypeScript type checking
3. `pnpm format:check` - Prettier format checking
4. `pnpm lint` - ESLint code quality checks
