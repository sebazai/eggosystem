# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Kanaliiga Eggosystem — a corporate CS2 esports tournament management platform. PNPM workspace monorepo with:

- `apps/backend` — Express 5 + TypeScript API (Knex.js, MariaDB, JWT, Passport/Steam, BullMQ)
- `apps/frontend` — Next.js 16 App Router + React 19, Tailwind v4, Radix UI, shadcn
- `packages/types` — shared TypeScript types and test-data factories (`@eggosystem/types`)
- `packages/shared-msw`, `packages/viewer`, `packages/eslint`, `packages/tsconfig` — shared configs and MSW handlers
- `apps/backend/migrations`, `apps/backend/seeds` — Knex migrations (150+) and dev/E2E seeds

Builds are orchestrated by Turborepo; `@eggosystem/types` and `@eggosystem/shared-msw` must be built before downstream `dev`/`build`/`typecheck`/`test` tasks (encoded in `turbo.json`).

Extended docs live in `README.architecture.md`, `README.api.md`, `README.database.md`, `README.commands.md`, `README.frontend.md`, `README.dashboard.md`, `README.testing.md`, `README.playwright.md`.

## Working Directory Rules

Always prepend `cd $(git rev-parse --show-toplevel)` (root) or `cd $(git rev-parse --show-toplevel)/apps/{backend,frontend}` to commands. Never use bare relative paths; never split `cd` and the command into separate tool calls.

## Commands

All commands are pnpm-based; turbo fans out to workspaces from the root.

```bash
# Install & setup (root)
pnpm install
pnpm setup:dev            # install + playwright + build + migrate + seed
pnpm fresh                # nuke node_modules / .turbo / .next, reinstall, build, reseed

# Dev servers
pnpm dev                  # turbo: backend (:3001) + frontend (:3000)
pnpm --filter=backend dev
pnpm --filter=backend dev:e2e   # NODE_ENV=e2e, loads .env.local.test
pnpm --filter=frontend dev

# Build / start
pnpm build
pnpm start

# Quality gates (run all before considering code done)
pnpm quality              # knip + typecheck + format:check + lint
pnpm typecheck
pnpm lint                 # turbo lint --continue
pnpm lint:fix
pnpm format               # prettier --write
pnpm knip                 # dead-code / unused-deps check

# Unit tests (Jest)
pnpm test                 # all workspaces
pnpm --filter=backend test
pnpm --filter=frontend test
pnpm --filter=backend test -- leaderboards       # run by filename substring
pnpm --filter=backend test -- path/to/file.test.ts
pnpm test:watch

# E2E (Playwright) — ALWAYS from workspace root
pnpm test:e2e                         # build + reseed:e2e + playwright
pnpm test:e2e -- --grep "Signup Form" # pass-through args after --
pnpm test:e2e:ui                      # Playwright UI
pnpm install:playwright               # chromium + system deps

# Database
pnpm migrate                              # run pending migrations
pnpm migrate:make <name>                  # create migration
pnpm migrate:rollback | migrate:status
pnpm seed                                 # dev_seed.ts
pnpm reseed                               # reset + seed + migrate
pnpm --filter=backend reseed:e2e          # + e2e_test_seed.ts
```

## Architecture

### Monorepo / Build Graph

Turbo tasks `dev`, `build`, `typecheck`, `test` all `dependsOn: ["@eggosystem/types#build", "@eggosystem/shared-msw#build"]`. When types or shared-msw change, downstream workspaces need a rebuild — `pnpm build` handles this. `@eggosystem/types` is consumed as a workspace dep by both apps and must compile before backend/frontend type-check.

### Backend (Express 5 + Knex + MariaDB)

- Entry: `apps/backend/src/app.ts` mounts `v1Router` at `/api/v1`, wires `helmet`, `cors` (`origin: true, credentials: true`), `morgan`, `cookie-parser`, Passport, and a central `expressErrorHandler`. Body limit is 10 MB.
- Routes: `src/routes/v1/*.routes.ts` → controllers in `src/controllers/` → business logic in `src/services/` → DB access via Knex in `src/db/` and `src/models/`.
- Auth: Steam OpenID via Passport → issues RSA-signed JWT access + refresh tokens (keys in `apps/backend/private_*_token.pem` / `public_*_token.pem`, generated via `openssl` per README). `authenticateJWT` middleware protects routes; some are additionally `authenticateJWT + admin` or `corsMiddleware + authenticateJWT` depending on exposure.
- Validation: Zod schemas in `src/schemas/`.
- **Shared utilities:** `apps/backend/src/utils/` — reusable pure helpers (e.g. `date-utils`, `number-utils` with MariaDB DECIMAL coercion and K/D rounding). **Prefer importing from here** instead of copying helpers into models or services; add new cross-cutting helpers as new modules or exports in the appropriate util file.
- Error format: RFC 7807 Problem Details. Controllers should `return next(new ErrorClass(...))`; services throw and let errors bubble.
- Database identity: **Steam ID is the canonical player ID.** The SQL function `get_account_id_from_steam_id` bridges Steam IDs to internal account IDs. Many business rules (captain permissions, roster uniqueness, primary player validation) are enforced by **database triggers** — changing application code alone won't bypass them; see `README.database.md` and the `*-triggers.test.ts` files under `src/db/`.
- Dual-roster design: `SeasonTeamRegistrationPlayers` (registration intent, immutable) vs `SeasonTeamPlayers` (live roster, mutable post-Sortter). Don't conflate them.
- Async subsystems, each gated on env + `NODE_ENV` in `app.ts`:
  - **Discord**: initialized on boot when `DISCORD_BOT_TOKEN` + `DISCORD_GUILD_ID` set (skipped in test/e2e). Failures are non-fatal.
  - **RabbitMQ queue consumers**: `queueConsumerManager.startAllConsumers()` when `RABBITMQ_*` set (skipped in test/e2e).
  - **BullMQ email queue** (`welcome-emails`): Redis-backed, rate-limited (1 email / `EMAIL_SEND_DELAY_MS`, default 500–750 ms), 3 retries with exponential backoff, concurrency 1. Enqueued on Sortter finalization; worker lifecycle follows the server process. bull-monitor UI on `:3010` in dev.
- env loading in `app.ts`: `.env.local.test` when `NODE_ENV=e2e`; `.env.development` then `.env` when `NODE_ENV=development|test`. Production requires `DB_*` and `FRONTEND_URL` to be set or the process throws on boot.

### Frontend (Next.js 16 App Router, React 19)

- `apps/frontend/src/app` uses route groups: `(admin)` dashboard, `(main)` public, `(embed)` embedded widgets, `(health)`. Styling is Tailwind v4 + shadcn (`components.json`) + Radix primitives.
- Data fetching: SWR client-side; server components + route handlers as needed. Forms: `react-hook-form` + Zod via `@hookform/resolvers`.
- Dashboard auth: cookie-based JWT (`access_token`) issued by backend. E2E tests and the Playwright MCP inject this cookie directly — see `apps/frontend/src/e2e/utils/index.ts` (`generateTestJWTForUser`) and `.cursor/rules/development/playwright-mcp-admin-auth.mdc`.
- Build output uses Next standalone; `postbuild` copies static/public into `.next/standalone/apps/frontend/`.
- `AGENTS.md` in `apps/frontend` is an auto-generated Next.js docs index — don't edit by hand.

### Shared Types and Test Factories

`@eggosystem/types` exports both types and `createMockX(overrides?)` factory functions. **Always use the factories** (`packages/types/src/**/*.test-utils.ts`) in tests — don't construct inline mock entities. Co-locate new factories next to the type and export from the module's `index.ts`.

## Project Conventions (from `.cursor/rules/`)

These are enforced rules, not suggestions:

- **No unsafe type casting.** Don't use `as SomeType` or `as unknown as SomeType`. Use `satisfies`, type guards, or properly typed mocks. Don't inline `import("module").Type` — use named imports.
- **No try/catch unless it owns cleanup.** Only use try/catch for DB transactions that need cleanup; otherwise let errors bubble so the Express error handler formats them as RFC 7807.
- **Reuse via exports, not duplication.** Export shared helpers and import them; don't re-implement.
- **Git policy:** Never use `--no-verify` / `--no-gpg-sign`. Commits and PRs are allowed as part of automated workflows.
- **Database queries during exploration:** use the MariaDB MCP server (`execute_sql`, `list_tables`, `get_table_schema*`) against database `kanaliiga` for ad-hoc inspection. Application code still uses Knex.

## Quality Gate (before finishing any change)

Run all four; fix failures without violating the rules above:

```bash
pnpm knip
pnpm typecheck
pnpm format        # or format:check in CI
pnpm lint
```

## Testing Notes

- **Unit tests** live next to the code (`*.test.ts(x)`). Backend tests use Jest + Supertest; create apps with `createExpressTestApp(router, mountPath)` from `src/test-utils` and always call the returned `cleanup()` in `afterEach`.
- **E2E tests** must be run from the workspace root via `pnpm test:e2e` — this builds, reseeds the E2E DB, then runs Playwright. Running `pnpm test:e2e` from `apps/frontend` or using `test:e2e:run` directly skips the reseed/build and produces stale results.
- Backend E2E server: `cd apps/backend && pnpm dev:e2e` (loads `.env.local.test`, uses the same E2E seed data).
- Chromium-only Playwright install: `pnpm install:playwright`.

## Database & Migrations

- Connection: MariaDB (`kanaliiga`), accessed via Knex (`apps/backend/knexfile.ts`); PhpMyAdmin on `:8082` (compose) or `:8083` (devcontainer), root/dev-pass.
- Seeds: `dev_seed.ts` for dev, `e2e_test_seed.ts` for E2E, `reset_seed.ts` to wipe. After creating a new migration, update the dev/E2E seeds (see `docs/update_dev_seed.md`).
- Business logic lives in triggers and SQL functions — read `README.database.md` before changing roster, captain, or permission code.

## Environment

- **DevContainer** (`.devcontainer/`) is the recommended dev env; alternately `docker compose up` (see `docker-compose.yml` / `docker-compose.dev.yml`).
- Required local env: `STEAM_API_KEY` in `apps/backend/.env`; JWT keys generated via `openssl` commands in the README.
- Ports: backend `:3001`, frontend `:3000`, PhpMyAdmin `:8082/:8083`, bull-monitor `:3010`.
