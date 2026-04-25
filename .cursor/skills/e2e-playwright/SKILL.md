---
name: e2e-playwright
description: How and where to run E2E (Playwright) tests
---

# E2E and Playwright Tests

## Run from workspace root only

**Always run E2E (Playwright) tests from the workspace root** using:

```bash
cd $(git rev-parse --show-toplevel) && rtk pnpm test:e2e
```

This command:

1. Builds the monorepo
2. Reseeds the E2E database (`rtk pnpm --filter=backend reseed:e2e`)
3. Runs Playwright via `rtk pnpm --filter=frontend test:e2e`

Do **not** run `pnpm test:e2e` from `apps/frontend` or use `test:e2e:run` as the primary way to validate E2E, because that skips reseed and build and can lead to stale data or code.

## Running specific tests

From workspace root, pass Playwright args after `--`:

```bash
cd $(git rev-parse --show-toplevel) && rtk pnpm test:e2e -- --grep "Signup Form"
```

## Prerequisites

Ensure the backend E2E server is running when developing or debugging E2E locally:

```bash
cd $(git rev-parse --show-toplevel)/apps/backend && rtk pnpm dev:e2e
```

For a full run, `rtk pnpm test:e2e` from root handles reseed and build; the backend must be reachable during the Playwright step (CI or a separate `dev:e2e` process).
