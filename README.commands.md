# Development Commands

This document provides a comprehensive reference for all development commands in the Kanaliiga Eggosystem. All commands are pnpm-based; the root package uses Turborepo to fan out to workspaces.

Always run from the correct directory. Prepend either:

- `cd $(git rev-parse --show-toplevel)` for root commands, or
- `cd $(git rev-parse --show-toplevel)/apps/{backend,frontend}` for workspace-specific commands.

## Package Management

### Setup

```bash
# Install all dependencies across the workspace
pnpm install

# One-shot dev bootstrap: install + playwright + build + migrate + seed
pnpm setup:dev

# GitLab MCP (Cursor): ensure .env.mcp exists, print PAT help, open GitLab token page
pnpm gitlab:mcp:pat

# Install Playwright (chromium + system deps)
pnpm install:playwright

# Nuke node_modules / .turbo / .next, reinstall, rebuild, reseed
pnpm fresh
```

### GitLab MCP (Cursor)

The [GitLab MCP server](https://github.com/zereight/gitlab-mcp) runs through [`.cursor/gitlab-mcp.sh`](.cursor/gitlab-mcp.sh), which loads gitignored [`.env.mcp`](.env.mcp) from the repo root. Cursor reads [`.cursor/mcp.json`](.cursor/mcp.json).

**Create or refresh your Personal Access Token**

```bash
pnpm gitlab:mcp:pat
```

This script:

- Copies [`.env.mcp.example`](.env.mcp.example) to `.env.mcp` if `.env.mcp` does not exist (it never overwrites an existing file).
- Prints which GitLab scopes to choose (`read_api` vs `api`) and where to paste `glpat-...`.
- Opens the GitLab “Access Tokens” page in your browser (GitLab.com by default).

**Self-managed GitLab:** set `GITLAB_WEB_HOST` to your hostname (no `https://`) so the correct token page opens, for example:

```bash
GITLAB_WEB_HOST=gitlab.example.com pnpm gitlab:mcp:pat
```

**Headless / CI / no browser:** set `GITLAB_MCP_PAT_NO_OPEN=1` to skip opening a URL.

After editing `.env.mcp`, reload MCP in Cursor or restart the editor. Official PAT documentation: [Personal access tokens](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html).

### Root Workspace Commands

```bash
# Start dev (turbo: backend :3001 + frontend :3000)
pnpm dev

# Build all packages and apps (turbo build)
pnpm build

# Start production servers (turbo start)
pnpm start

# Run all unit tests (turbo test)
pnpm test

# Run unit tests followed by E2E
pnpm test:all

# Clean build artifacts across all workspaces
pnpm clean

# Add a shadcn component (passthrough to frontend)
pnpm shadcn:add -- <component>
```

### Backend Commands (`apps/backend`)

```bash
# Development server (nodemon)
pnpm --filter=backend dev

# E2E test backend (NODE_ENV=e2e, loads .env.local.test)
pnpm --filter=backend dev:e2e

# Production build (tsc -p tsconfig.build.json)
pnpm --filter=backend build

# Start compiled server (node ./dist/server.js)
pnpm --filter=backend start

# Run unit tests (NODE_ENV=test jest --coverage)
pnpm --filter=backend test

# Watch-mode unit tests
pnpm --filter=backend test:watch

# Serial tests (runInBand, detectOpenHandles)
pnpm --filter=backend test:serial

# Debug tests via node --inspect-brk
pnpm --filter=backend test:debug

# Type checking (tsc --noEmit)
pnpm --filter=backend typecheck

# Lint
pnpm --filter=backend lint

# Clean build output
pnpm --filter=backend clean

# Email queue smoke script
pnpm --filter=backend test:email-queue
```

### Frontend Commands (`apps/frontend`)

```bash
# Development server (next dev, :3000)
pnpm --filter=frontend dev

# Production build
pnpm --filter=frontend build

# E2E build (sets NEXT_PUBLIC_IMAGE_SERVICE_URL)
pnpm --filter=frontend build:e2e

# Start Next (next start)
pnpm --filter=frontend start

# Start the standalone output (port 3000)
pnpm --filter=frontend start:standalone

# Unit tests (jest)
pnpm --filter=frontend test

# Watch-mode unit tests
pnpm --filter=frontend test:watch

# Type checking (tsc --noEmit)
pnpm --filter=frontend typecheck

# Lint
pnpm --filter=frontend lint

# Playwright E2E (local / CI)
pnpm --filter=frontend test:e2e
pnpm --filter=frontend test:e2e:ui
pnpm --filter=frontend test:e2e:headed
pnpm --filter=frontend test:e2e:container   # uses PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Show a Playwright trace on :9323
pnpm --filter=frontend playwright-trace

# Clean Next/cache output
pnpm --filter=frontend clean

# Add a shadcn component
pnpm --filter=frontend shadcn:add <component>

# Refresh AGENTS.md from Next docs (auto-generated)
pnpm --filter=frontend agents-md
```

### Shared Packages (`packages/*`)

Workspace filters use the full package name:

```bash
# @eggosystem/types — shared TS types + test factories
pnpm --filter=@eggosystem/types build
pnpm --filter=@eggosystem/types dev         # tsc --watch
pnpm --filter=@eggosystem/types typecheck
pnpm --filter=@eggosystem/types lint
pnpm --filter=@eggosystem/types clean

# @eggosystem/shared-msw — MSW handlers
pnpm --filter=@eggosystem/shared-msw build
pnpm --filter=@eggosystem/shared-msw dev    # tsc --watch
pnpm --filter=@eggosystem/shared-msw clean

# @eggosystem/viewer — CS2 2D demo viewer component
pnpm --filter=@eggosystem/viewer build
pnpm --filter=@eggosystem/viewer dev        # dev-server.js
pnpm --filter=@eggosystem/viewer dev:direct # vite directly
pnpm --filter=@eggosystem/viewer dev:build  # tsc --watch
pnpm --filter=@eggosystem/viewer typecheck
pnpm --filter=@eggosystem/viewer lint

# @eggosystem/eslint, @eggosystem/tsconfig — config-only, no scripts to run
```

`@eggosystem/types#build` and `@eggosystem/shared-msw#build` are declared `dependsOn` for the turbo `dev`, `build`, `typecheck`, and `test` tasks — they will build automatically as needed.

## Database Commands

**Schema Reference**: See `README.database.md` for complete schema documentation including triggers, functions, and relationships.

### Migration Commands

Run from the workspace root (turbo dispatches to backend); or invoke directly on backend.

```bash
# Run pending migrations
pnpm migrate

# Create a new migration (passes name through to knex)
pnpm migrate:make <migration_name>

# Rollback the last batch
pnpm migrate:rollback

# Roll one migration down / up
pnpm migrate:down
pnpm migrate:up

# Check migration status
pnpm migrate:status
```

### Seed Commands

```bash
# Run dev seed (dev_seed.ts)
pnpm seed

# Reset DB, re-seed dev, re-migrate, (and for :e2e) apply e2e seed
pnpm reseed
pnpm --filter=backend reseed:e2e

# Alias of reseed
pnpm seed:reset

# Apply only the E2E seed layer
pnpm --filter=backend seed:e2e
```

When adding a new migration, also update `dev_seed.ts` and `e2e_test_seed.ts` (see `docs/update_dev_seed.md`).

## Testing Commands

### Unit Testing (Jest)

```bash
# Run all unit tests across workspaces
pnpm test

# Run tests for a single app
pnpm --filter=backend test
pnpm --filter=frontend test

# Run backend only, from root
pnpm test:backend

# Run by filename substring / path
pnpm --filter=backend test -- leaderboards
pnpm --filter=backend test -- path/to/file.test.ts

# Watch mode across both apps
pnpm test:watch
```

### E2E Testing (Playwright)

`pnpm test:e2e` must be run from the workspace root — it builds, reseeds the E2E DB, and then runs Playwright. Running the raw frontend script skips the reseed/build and produces stale results.

```bash
# Full E2E flow: build + reseed:e2e + playwright
pnpm test:e2e

# Pass-through args (after --)
pnpm test:e2e -- --grep "Signup Form"
pnpm test:e2e -- --headed

# Re-run Playwright only (no build, no reseed)
pnpm test:e2e:run

# Clean + full E2E (nukes .next, reports, .turbo)
pnpm test:e2e:clean

# Playwright UI mode
pnpm test:e2e:ui
pnpm test:e2e:ui:container    # xvfb wrapper for containers

# Replay a Playwright trace file
pnpm playwright-trace -- <trace-file>
```

The backend E2E server can be run standalone with `pnpm --filter=backend dev:e2e` (loads `.env.local.test`).

## Quality Assurance Commands

### Quality Gate

```bash
# Full gate: knip + typecheck + format:check + lint
pnpm quality
```

Run `pnpm quality` (and fix failures) before considering any change done.

### Individual Gates

```bash
# Dead-code / unused-deps check
pnpm knip

# Type checking across workspaces (turbo typecheck)
pnpm typecheck

# Lint across workspaces (turbo lint --continue)
pnpm lint
pnpm lint:fix

# Prettier
pnpm format          # prettier --write
pnpm format:check    # prettier --check
```

### Build

```bash
# Build everything (turbo build)
pnpm build

# Build a specific workspace
pnpm --filter=backend build
pnpm --filter=frontend build
pnpm --filter=@eggosystem/types build
pnpm --filter=@eggosystem/shared-msw build

# Clean build artifacts (turbo clean)
pnpm clean
```

## Docker Commands

### Development Environment

```bash
# Start development environment
docker compose up

# Start with seed profile
docker compose --profile seed up

# Start specific services
docker compose up devdb phpmyadmin

# Stop all services
docker compose down

# Rebuild containers
docker compose build
```

### Database Access

```bash
# Access MariaDB directly
docker compose exec devdb mysql -u root -p

# PhpMyAdmin
# http://localhost:8082 (docker compose)
# http://localhost:8083 (devcontainer)

# Database backup
docker compose exec eggo-db-backup /bin/bash -c 'mysql-backup dump --server $DB_SERVER --user $DB_USER --pass $DB_PASS --target $DB_DUMP_TARGET'
```

## JWT Key Generation

```bash
# Access token keys
openssl genpkey -algorithm RSA -out apps/backend/private_access_token.pem
openssl rsa -pubout -in apps/backend/private_access_token.pem -out apps/backend/public_access_token.pem

# Refresh token keys
openssl genpkey -algorithm RSA -out apps/backend/private_refresh_token.pem
openssl rsa -pubout -in apps/backend/private_refresh_token.pem -out apps/backend/public_refresh_token.pem
```

## Playwright Setup

```bash
# Install Playwright browsers and system deps (chromium)
pnpm install:playwright

# Or manually
pnpm exec playwright install chromium
pnpm exec playwright install-deps chromium

# For macOS with devcontainer (XQuartz setup)
xhost localhost
```

## Utility Scripts

### Database Utilities

```bash
# Generate database diagram
./scripts/generate-database-diagram.sh

# Wait for database to be ready
./scripts/wait-for-kanadb.sh

# Cleanup local environment
./scripts/cleanup-local.sh
```

### Deployment Scripts

```bash
# Deploy to local environment
./scripts/deploy-local.sh

# Deploy to Portainer
./scripts/deploy-to-portainer.sh

# Cleanup Portainer stack
./scripts/cleanup-portainer-stack.sh
```

## Command Patterns

### Filtering Commands

Workspace filter names match the `name` field in each package's `package.json`:

- `backend` (apps/backend)
- `frontend` (apps/frontend)
- `@eggosystem/types`, `@eggosystem/shared-msw`, `@eggosystem/viewer`, `@eggosystem/eslint`, `@eggosystem/tsconfig`

```bash
# Run a command for a single workspace
pnpm --filter=backend <command>
pnpm --filter=frontend <command>
pnpm --filter=@eggosystem/types <command>

# Run a command for multiple workspaces
pnpm --filter=backend --filter=frontend <command>
```

### Turbo Pipeline

Tasks defined in `turbo.json`:

- `build`, `dev`, `test`, `typecheck` — all `dependsOn` `@eggosystem/types#build` and `@eggosystem/shared-msw#build`
- `lint`, `format:check` — fan out via `^<task>`
- `clean`, `shadcn:add` — cache disabled
- `migrate`, `migrate:rollback`, `migrate:down`, `migrate:up`, `migrate:make`, `migrate:status`, `seed` — cache disabled, scoped to DB env

### Workspace Root Commands

```bash
# Always run from workspace root for cross-package operations
cd $(git rev-parse --show-toplevel) && pnpm <command>

# Backend-specific
cd $(git rev-parse --show-toplevel)/apps/backend && pnpm <command>

# Frontend-specific
cd $(git rev-parse --show-toplevel)/apps/frontend && pnpm <command>
```

## Troubleshooting

### Common Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install

# Or the one-shot nuke-and-rebuild
pnpm fresh

# Reset database
pnpm reseed

# Clear build artifacts
pnpm clean
pnpm build

# Check workspace graph
pnpm list --depth=0
```

### Environment Issues

```bash
# Check environment variables
env | grep -E "(NODE_ENV|DB_|JWT)"

# Verify database connection
pnpm --filter=backend migrate:status

# Check service health
curl http://localhost:3001/health
curl http://localhost:3000
```
