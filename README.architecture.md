# Architecture Overview

This document explains the system architecture, key design decisions, and patterns for the Kanaliiga Eggosystem - a comprehensive esports tournament management platform for corporate CS2 leagues.

## System Structure

### Monorepo Organization

```
/workspace/
├── apps/
│   ├── backend/          # Express 5 API server (TypeScript, Knex, MariaDB)
│   └── frontend/         # Next.js 16 App Router application (React 19)
├── packages/
│   ├── types/            # @eggosystem/types — shared types + test-data factories
│   ├── shared-msw/       # @eggosystem/shared-msw — MSW handlers
│   ├── viewer/           # @eggosystem/viewer — shared viewer package
│   ├── eslint/           # @eggosystem/eslint — shared ESLint configs
│   └── tsconfig/         # @eggosystem/tsconfig — shared tsconfig presets
└── apps/backend/
    ├── migrations/       # Knex migrations
    └── seeds/            # Dev and E2E seed scripts
```

Turbo orchestrates the build graph (see [`turbo.json`](turbo.json)). Tasks rely on
topological dependencies (`^build`) so the shared `@eggosystem/*` packages compile
before the backend or frontend build, type-check, or run. The `dev` and `test`
tasks additionally `dependsOn` `@eggosystem/types#build` and
`@eggosystem/shared-msw#build` directly, so those packages are guaranteed present
before the apps start in watch mode or run their suites.

### Technology Stack

- **Backend**: Node.js + Express 5 + TypeScript, Knex query builder, Passport
  (Steam OpenID), BullMQ
- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript, Tailwind v4,
  shadcn on top of Radix UI primitives, SWR for data fetching,
  `react-hook-form` + Zod (`@hookform/resolvers`)
- **Database**: MariaDB accessed via Knex.js; business rules enforced in SQL
  triggers and functions
- **Queues**: BullMQ (Redis-backed) for the `welcome-emails` queue; RabbitMQ
  for external queue consumers
- **Package Manager**: PNPM workspaces driven by Turborepo
- **Testing**: Jest (unit) + Playwright (E2E)
- **Development**: DevContainer + Docker Compose
- **Monitoring**: Grafana Alloy with OpenTelemetry
- **Partnerships**: Allstar (demo parsing), FaceIT (tournament platform)

## Core Business Model

### Tournament Structure

Kanaliiga operates as a **corporate esports league** with the following key concepts:

- **Seasons**: Primary organizational unit for tournaments (always required)
- **Leagues**: Skill-based tiers within seasons (created by the "Sortter" algorithm)
- **Teams**: Can be corporate teams (tied to organizations) or scramble/pick-up teams
- **Players**: Must have work email OR employment verification for corporate teams

### Registration-to-Competition Pipeline

The system implements a **dual-roster architecture**:

1. **Registration Phase**: Teams register players in `SeasonTeamRegistrationPlayers`
   (registration intent, immutable once Sortter has run).
2. **Sorting Phase**: The "Sortter" algorithm processes registrations to create
   balanced leagues.
3. **Competition Phase**: Final rosters are materialised into `SeasonTeamPlayers`
   for active tournament play.
4. **Runtime Flexibility**: `SeasonTeamPlayers` can be modified (add players,
   substitutes, discard a player) without mutating the original registration
   record.

This separation preserves the original registration decisions as an audit
record while allowing mid-season roster flexibility. Do not conflate the two
tables in application code or queries.

## Backend Request Flow

### Entry Point

`apps/backend/src/app.ts` is the Express application factory. It:

- Loads environment variables based on `NODE_ENV`:
  - `e2e` → `.env.local.test`
  - `development` / `test` → `.env.development` then `.env` (development takes
    precedence)
  - any other value → DB credentials (`DB_HOST`, `DB_PORT`, `DB_USER`,
    `DB_PASSWORD`, `DB_NAME`) must already be set in the environment, otherwise
    boot throws. `FRONTEND_URL` is required in all environments.
- Wires middleware in order: `cookie-parser`, `cors({ origin: true, credentials: true })`,
  `express.json({ limit: "10mb" })`, `helmet`, `morgan("dev")` (skipping
  `/api/v1/health`), `passport.initialize()`.
- Mounts `v1Router` at `/api/v1` and terminates the chain with the central
  `expressErrorHandler`.
- Conditionally boots async subsystems (see below).

### Layering

Incoming requests flow through:

```
routes/v1/*.routes.ts  →  controllers/*.controllers.ts  →  services/*.services.ts
                                                              ↓
                                                      models/*.models.ts
                                                              ↓
                                                         db/ (Knex)
```

- Zod request/response validation lives in `apps/backend/src/schemas/`.
- Controllers return `next(new ErrorClass(...))`; services throw and let
  errors bubble to the error handler.
- `try`/`catch` is reserved for DB transactions that own cleanup.

### API Architecture

- **RESTful APIs**: Standard HTTP methods with JSON responses
- **Error Handling**: RFC 7807 Problem Details format (`application/problem+json`)
  emitted by `middlewares/express-error-handler.ts`. It special-cases
  `UnauthorizedError` (express-jwt), `ZodError`, and `BaseError` subclasses, and
  forwards MariaDB constraint / trigger errors through
  `convertDatabaseErrorToConflictError`.
- **Authentication**: Steam OpenID via Passport issues an RSA-signed JWT
  access token and a refresh token. Keys are stored at
  `apps/backend/private_access_token.pem`, `public_access_token.pem`,
  `private_refresh_token.pem`, and `public_refresh_token.pem`. Route protection
  uses the `authenticateJWT` middleware (with an additional `admin` guard on
  privileged routes).
- **Validation**: Zod schemas for request/response validation.

### Database Design Philosophy

- **Schema Reference**: See [Database Schema](README.database.md) for complete schema documentation
- **Migrations**: Knex.js migration system
- **Seeds**: Development and E2E test data
- **Relationships**: Foreign key constraints with proper indexing
- **Business Logic in Database**: Triggers enforce critical business rules (captain permissions, unique constraints)
- **Utility Functions**: Database functions like `get_account_id_from_steam_id` for Steam ID mapping
- **Backups**: Automated daily backups with 7-day retention

## Key Architectural Decisions

### Identity Management: Steam ID as Primary

**Decision**: Steam ID is the primary player identifier throughout the system.

**Rationale**:

- Steam is the primary authentication method
- Creates natural 1:1 mapping between authentication and player identity
- Eliminates complexity of maintaining separate internal IDs
- Ensures authentication system and player data are always aligned

**Implementation**: Database function `get_account_id_from_steam_id` bridges between Steam IDs and internal account system for permission management.

### Business Logic in Database Triggers

**Decision**: Critical business rules enforced via database triggers rather than application code.

**Rationale**:

- **Data Consistency**: Captain permissions automatically sync with captain status changes
- **Simplicity**: Reduces application code complexity
- **Reliability**: Works regardless of how data is modified (direct DB changes, admin tools, migrations)
- **Low Risk**: Captain permissions don't have high security implications

**Examples**: Captain permission management, unique constraints, primary player validation.

### Multi-Platform Support Strategy

**Decision**: Support multiple external platforms (FaceIT, Esportal, PopFlash) with platform-agnostic architecture.

**Rationale**:

- **Negotiating Power**: Not locked into single platform
- **Resilience**: Can pivot if platform changes terms, pricing, or API
- **Flexibility**: Different platforms for different tournament types

**Implementation**: `platform` enum in Seasons, external ID tracking, webhook processing for platform-specific data.

### Flexible Match System

**Decision**: Support both season-based matches and standalone matches (nullable season_id/league_id).

**Rationale**:

- **Corporate Leagues**: Season-based matches for structured tournaments
- **External Integration**: Standalone matches for FaceIT matchmaking, one-off tournaments
- **Future Flexibility**: Can handle various tournament formats

**Implementation**: Triggers validate data integrity when season/league context is provided.

## Async Subsystems

Async subsystems are gated on environment / `NODE_ENV`, skipped in `test` and
`e2e` mode, and their failures are non-fatal — the HTTP server still starts. The
Discord bot and RabbitMQ consumers are wired in `app.ts`; the BullMQ email worker
is started from `server.ts` (`startEmailWorker()`).

- **Discord bot** (`app.ts`) — initialised when `DISCORD_BOT_TOKEN` and
  `DISCORD_GUILD_ID` are set. Uses `initializeDiscordClient` and
  `setupDiscordEventHandlers` from `services/discord.services.ts`. Reconnection is
  attempted on subsequent requests if initial connect fails.
- **RabbitMQ queue consumers** (`app.ts`) — started via
  `queueConsumerManager.startAllConsumers()` when `RABBITMQ_HOST`,
  `RABBITMQ_USER`, and `RABBITMQ_PASSWORD` are present. Automatic reconnection
  is built into the manager.
- **BullMQ email queue (`welcome-emails`)** — Redis-backed; the worker is started
  from `server.ts` via `startEmailWorker()`. Rate-limited (1 email per
  `EMAIL_SEND_DELAY_MS`), 3 retry attempts with exponential backoff, worker
  concurrency 1. Enqueued on Sortter finalisation; worker lifecycle follows the
  server process.

## Frontend Architecture

- App directory: `apps/frontend/src/app` with four route groups:
  - `(admin)` — dashboard views (cookie-based JWT auth)
  - `(main)` — public-facing pages
  - `(embed)` — embedded widgets
  - `(health)` — health-check surface
- Styling: Tailwind v4, shadcn components (`components.json`), Radix UI
  primitives.
- Data fetching: SWR on the client; server components and route handlers where
  appropriate.
- Forms: `react-hook-form` + Zod via `@hookform/resolvers`.
- Build output uses Next.js standalone mode; `postbuild` copies `.next/static`
  and `public/` into `.next/standalone/apps/frontend/`.
- Dashboard auth: the backend sets an `access_token` cookie containing the
  RSA-signed JWT. E2E tests and the Playwright MCP inject this cookie directly
  via `generateTestJWTForUser` in `apps/frontend/src/e2e/utils/index.ts`, which
  signs tokens with the backend's `private_access_token.pem`.

## Shared Packages

- **`@eggosystem/types`** — every persisted entity has both a TypeScript type
  and a `createMockX(overrides?)` factory colocated in
  `packages/types/src/**/*.test-utils.ts`. Tests must use these factories
  instead of hand-rolled mock objects.
- **`@eggosystem/shared-msw`** — MSW request handlers reused across the
  frontend and backend test suites.
- **`@eggosystem/viewer`**, **`@eggosystem/eslint`**, **`@eggosystem/tsconfig`**
  — shared viewer, lint, and tsconfig presets consumed via `workspace:*`.

## Key Patterns

### Error Handling

- **Controllers**: Use `return next(new ErrorClass("message"))`
- **Services/Models**: Throw errors and let them bubble up
- **Try/Catch**: Only for database transactions with cleanup
- **RFC 7807**: All errors formatted as Problem Details
- **Database Constraints**: Propagated to frontend via error handling middleware

### Type Safety

- **No Unsafe Casting**: Use `satisfies` operator and type guards
- **Separate Interfaces**: Raw database types vs processed application types
- **Validation**: Runtime type checking with Zod schemas

### Testing Strategy

- **Unit Tests**: Fast Jest tests for business logic
- **E2E Tests**: Playwright tests with real backend
- **TDD Workflow**: Write tests first, then implementation
- **Test Utilities**: Centralized setup with `createExpressTestApp`

## External Integrations

### Allstar Partnership

**Purpose**: Demo parsing and clip generation for CS2 matches.

**Benefits**:

- Offloads heavy processing (demo parsing, clip extraction) to specialized service
- Reduces infrastructure costs for video processing and storage
- Provides professional-quality clips and match analysis
- Stores only metadata and links in database, keeping it lightweight

### FaceIT Integration

**Purpose**: Tournament platform integration for match management.

**Features**:

- Webhook processing for match status updates
- Map veto data retrieval via API
- Championship creation and management
- External ID mapping for league structure

### Kanahautomo Discord Service

**Purpose**: Discord community management and role assignment.

**Features**:

- Automatic Discord role assignment based on registration
- Discord server access management
- Integration with organization Discord invite links

## Email Queue System

### Overview

The email queue system uses **BullMQ** (Redis-backed job queue) to send welcome emails to players when sortter placements are finalized.

### Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│ Sortter         │      │  Redis Queue     │      │  Email Worker   │
│ Finalization    │─────▶│   (BullMQ)       │◀─────│  (Backend)      │
│ Controller      │      │  welcome-emails  │      │                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                  │                          │
                                  │                          │ Send Email
                                  ▼                          ▼
                         ┌──────────────────┐      ┌─────────────────┐
                         │  bull-monitor    │      │  SMTP Server    │
                         │  (Monitoring)    │      │                 │
                         └──────────────────┘      └─────────────────┘
                                  │
                                  │ Metrics
                                  ▼
                         ┌──────────────────┐
                         │  Grafana Cloud   │
                         │  (via Alloy)     │
                         └──────────────────┘
```

### Components

#### 1. Email Queue Service (`email-queue.services.ts`)

**Responsibilities**:

- Initialize BullMQ queue connected to Redis
- Enqueue individual or bulk welcome email jobs
- Configure rate limiting and retry policies

**Configuration**:

- **Queue Name**: `welcome-emails`
- **Rate Limit**: one email per `EMAIL_SEND_DELAY_MS` (queue-side default 500 ms;
  worker-side limiter default 750 ms)
- **Retry Strategy**: 3 attempts with exponential backoff (1s, 2s, 4s)
- **Job Cleanup**: Completed jobs removed after 7 days, failed after 30 days

#### 2. Email Worker (`email-worker.services.ts`)

**Responsibilities**:

- Process jobs from the queue sequentially
- Call existing `sendSeasonWelcomeEmail` function
- Track success/failure statistics in Redis
- Handle graceful shutdown

**Configuration**:

- **Concurrency**: 1 (sequential processing to respect rate limit)
- **Lifecycle**: Starts with backend server, stops on SIGTERM/SIGINT

#### 3. bull-monitor (Docker Service)

**Responsibilities**:

- Provide web UI for queue management (bull-board)
- Expose Prometheus metrics at `/metrics` endpoint
- Monitor queue health and job status

**Access**:

- **Development**: `http://localhost:3010`
- **Production**: Internal network only (SSH tunnel recommended)

### Why BullMQ?

**Advantages over direct sending**:

- **Spam Filter Prevention**: Rate limiting prevents bulk email detection
- **Reliability**: Automatic retries with exponential backoff
- **Monitoring**: Built-in metrics and UI for queue visibility
- **Scalability**: Can handle large volumes (800+ emails) without blocking
- **Redis Integration**: Leverages existing Redis infrastructure

**Why BullMQ over RabbitMQ**:

- Simpler integration with existing Redis (no new infrastructure)
- Built-in rate limiting and retry mechanisms
- Better TypeScript support
- Native Prometheus metrics via bull-monitor

### Email Sending Flow

1. **Sortter Finalization**: Admin finalizes team placements
2. **Enqueue Jobs**: `enqueueSeasonFinalizationWelcomeEmails` adds all jobs to queue
3. **Rate-Limited Processing**: Worker processes one job per `EMAIL_SEND_DELAY_MS` (worker-side limiter default 750 ms)
4. **Email Sending**: Each job calls `sendSeasonWelcomeEmail` via nodemailer
5. **Statistics Tracking**: Success/failure counts stored in Redis (`email-stats:season:{id}`)
6. **Monitoring**: bull-monitor exposes metrics to Grafana via Alloy

### Configuration

**Environment Variables**:

- `EMAIL_SEND_DELAY_MS` - Delay between emails in milliseconds (queue-side default 500 ms, worker-side limiter default 750 ms; the worker limiter governs actual send cadence)
- `REDIS_HOST` - Redis host for BullMQ (default: eggo-redis)
- `REDIS_PORT` - Redis port (default: 6379)

### Monitoring

See [BullMQ Grafana Monitoring](docs/monitoring/bullmq-grafana.md) for detailed monitoring setup.

**Key Metrics**:

- `jobs_completed_total` - Total completed jobs
- `jobs_failed_total` - Total failed jobs
- `job_duration` - Processing time per job
- `job_wait_duration` - Time waiting in queue

**Grafana Dashboards**:

- **Queue Overview**: Dashboard [#14538](https://grafana.com/grafana/dashboards/14538)
- **Queue Specific**: Dashboard [#14537](https://grafana.com/grafana/dashboards/14537)

### Error Handling

**Job Failures**:

- Automatic retry with exponential backoff (3 attempts)
- Failed jobs tracked in Redis for admin review
- Errors logged with player details for debugging

**Worker Failures**:

- Graceful shutdown on SIGTERM/SIGINT
- Jobs remain in queue and resume on restart
- No email duplication (job IDs prevent re-processing)

## Development Workflow

### Local Development

1. **DevContainer**: Automatic environment setup
2. **Database**: MariaDB with PhpMyAdmin
3. **Hot Reload**: Both frontend and backend support hot reload
4. **Type Checking**: Real-time TypeScript validation

### Quality Gates

All code must pass:

1. TypeScript type checking
2. ESLint code quality checks
3. Prettier formatting
4. Unit test suite

## Deployment

### Environment Setup

- **Development**: DevContainer with Docker Compose
- **Staging**: Docker Compose with staging configuration
- **Production**: Docker Compose with production configuration

### Database Management

- **Migrations**: Version-controlled schema changes
- **Seeds**: Environment-specific data setup
- **Backups**: Automated daily backups with 7-day retention

## Security Considerations

- **JWT Tokens**: RSA-signed access and refresh tokens
- **CORS**: Configured for frontend domain
- **Input Validation**: Zod schemas for all API inputs
- **SQL Injection**: Knex.js query builder prevents SQL injection
- **GDPR Compliance**: Minimal audit logging for Account access only
- **Policy Management**: Automatic re-consent when privacy policy versions change

## Performance

- **Database Indexing**: Proper indexes on foreign keys and search columns
- **Query Optimization**: Efficient database queries with proper joins
- **Monitoring**: Grafana Alloy with OpenTelemetry for performance tracking
- **Frontend**: Next.js optimizations (SSR, code splitting)

## Monitoring

- **Logging**: Structured logging with appropriate levels
- **Error Tracking**: RFC 7807 error responses for debugging
- **Database Monitoring**: Query performance and connection pooling via Grafana Alloy
- **Health Checks**: API endpoints for service health monitoring
