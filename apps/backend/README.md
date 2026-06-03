# Backend — Kanaliiga Eggosystem

Express 5 + TypeScript API server (Knex query builder, MariaDB, BullMQ, Passport/Steam OpenID). This file covers backend-specific environment variables and scripts. For request flow, routing, auth, and error-handling conventions see the root docs:

- [Architecture](../../README.architecture.md) — entry point, layering, async subsystems, email queue
- [Backend API](../../README.api.md) — routes, authentication, error format
- [Database](../../README.database.md) — schema, migrations, triggers

## Environment Variables

Environment loading is driven by `NODE_ENV` (see `src/app.ts`): `e2e` → `.env.local.test`; `development`/`test` → `.env.development` then `.env`; otherwise the DB credentials below must already be present in the environment.

### Required (non-development environments)

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Database connection (see `src/configs/db-env.ts`)
- `FRONTEND_URL` - Required in all environments; used for CORS/redirects

### Redis (queues, caching, refresh-token store)

- `REDIS_HOST` - Redis host (default: `eggo-redis`)
- `REDIS_PORT` - Redis port (default: `6379`)

### Email

- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` - SMTP transport for outgoing mail (nodemailer)
- `EMAIL_SEND_DELAY_MS` - Welcome-email rate limit. The **queue** side defaults to `500` and the **worker** limiter defaults to `750`; the worker limiter governs the actual send cadence. See `src/services/email-queue.services.ts` and `src/services/email-worker.services.ts`.

### Steam / Auth

- `STEAM_API_KEY` - Steam Web API key (apply at <https://steamcommunity.com/dev/apikey>)
- JWTs are RSA-signed using the `*_token.pem` key pairs in this directory (see the root README for key generation)

### Grafana Cloud Profiles

To enable profiling with Grafana Cloud via Alloy, the following environment variables are configured (see `src/configs/profiling.ts`):

- `OTEL_EXPORTER_OTLP_PROFILING_ENDPOINT` - Points to your local Alloy instance (e.g., `http://172.17.0.1:4040`)
- `OTEL_EXPORTER_OTLP_PROFILING_AUTH_TOKEN` - Optional when using local Alloy (Alloy handles authentication to Grafana Cloud)
- `ENABLE_PROFILING` - Set to `true` to enable profiling in development mode
- `OTEL_EXPORTER_OTLP_PROFILING_REGION_TAG` - Optional region tag for profiling metadata
- `OTEL_EXPORTER_OTLP_PROFILING_VERSION_TAG` - Optional version tag for profiling metadata

#### Alloy-based Setup

This application is configured to send profiling data through [Grafana Alloy](https://grafana.com/docs/alloy/) running at `http://172.17.0.1:4040`. Alloy then forwards the data to Grafana Cloud Profiles.

**Benefits of using Alloy:**

- Centralized telemetry collection
- Built-in authentication handling to Grafana Cloud
- No need to configure auth tokens in each application
- Better observability pipeline management

#### Getting Grafana Cloud Credentials

The Grafana Cloud credentials are configured in your Alloy instance, not directly in the application:

1. Configure Alloy with your Grafana Cloud Profiles endpoint and auth token
2. Ensure Alloy is accessible at `http://172.17.0.1:4040`
3. The application will automatically send profiling data to Alloy

#### Development Setup

For development, profiling is disabled by default. To enable it, set:

```
ENABLE_PROFILING=true
```

In production (`NODE_ENV=production`), profiling is enabled automatically when the required endpoint variable is present.

## Scripts

Run with `pnpm --filter=backend <script>` (or `pnpm <script>` from this directory). See `package.json` for the full, authoritative list.

| Script             | Purpose                                             |
| ------------------ | --------------------------------------------------- |
| `dev`              | Start the dev server with `nodemon` (hot reload)    |
| `dev:e2e`          | Start a dedicated E2E backend (`NODE_ENV=e2e`)      |
| `build`            | Compile TypeScript via `tsc -p tsconfig.build.json` |
| `start`            | Run the compiled server (`node ./dist/server.js`)   |
| `test`             | Run Jest with coverage (`NODE_ENV=test`)            |
| `lint`             | ESLint                                              |
| `typecheck`        | `tsc --noEmit`                                      |
| `migrate`          | Apply latest Knex migrations                        |
| `migrate:make`     | Scaffold a new migration                            |
| `migrate:rollback` | Roll back the last migration batch                  |
| `migrate:status`   | Show migration status                               |
| `seed`             | Run the dev seed (`dev_seed.ts`)                    |
| `seed:e2e`         | Run the E2E seed (`e2e_test_seed.ts`)               |
| `reseed`           | Reset, seed, and migrate the dev database           |
| `reseed:e2e`       | Reset and re-seed the E2E database                  |
