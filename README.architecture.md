# Architecture Overview

This document explains the system architecture, key design decisions, and patterns for the Kanaliiga Eggosystem - a comprehensive esports tournament management platform for corporate CS2 leagues.

## System Structure

### Monorepo Organization

```
/workspace/
├── apps/
│   ├── backend/          # Express.js API server
│   └── frontend/         # Next.js web application
├── packages/
│   ├── types/           # Shared TypeScript types
│   ├── eslint/          # Shared ESLint configurations
│   └── shared-msw/      # Mock Service Worker handlers
├── docs/                # Project documentation
└── scripts/             # Deployment and utility scripts
```

### Technology Stack

- **Backend**: Node.js + Express.js + TypeScript
- **Frontend**: Next.js + React + TypeScript
- **Database**: MariaDB with Knex.js ORM
- **Package Manager**: PNPM with workspace support
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

The system implements a sophisticated **dual-roster architecture**:

1. **Registration Phase**: Teams register players in `SeasonTeamRegistrationPlayers`
2. **Sorting Phase**: "Sortter" algorithm processes registrations to create balanced leagues
3. **Competition Phase**: Final rosters copied to `SeasonTeamPlayers` for active tournament play
4. **Runtime Flexibility**: Active rosters can be modified (add players, substitutes) without affecting original registration data

This separation ensures data integrity for original registration decisions while allowing mid-season roster flexibility.

## Data Flow

### API Architecture

- **RESTful APIs**: Standard HTTP methods with JSON responses
- **Error Handling**: RFC 7807 Problem Details format with database constraint propagation
- **Authentication**: Steam-based login with JWT tokens (access + refresh)
- **Validation**: Zod schemas for request/response validation

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
- **Rate Limit**: 1 email per 500ms (configurable via `EMAIL_SEND_DELAY_MS`)
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
3. **Rate-Limited Processing**: Worker processes one job every 500ms
4. **Email Sending**: Each job calls `sendSeasonWelcomeEmail` via nodemailer
5. **Statistics Tracking**: Success/failure counts stored in Redis (`email-stats:season:{id}`)
6. **Monitoring**: bull-monitor exposes metrics to Grafana via Alloy

### Configuration

**Environment Variables**:

- `EMAIL_SEND_DELAY_MS` - Delay between emails in milliseconds (default: 750)
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
