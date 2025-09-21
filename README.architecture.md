# Architecture Overview

This document explains the system architecture, key design decisions, and patterns for the Kanaliiga Eggosystem.

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

## Data Flow

### API Architecture

- **RESTful APIs**: Standard HTTP methods with JSON responses
- **Error Handling**: RFC 7807 Problem Details format
- **Authentication**: JWT tokens (access + refresh)
- **Validation**: Zod schemas for request/response validation

### Database Design

- **Schema Reference**: See [Database Schema](README.database.md) for complete schema documentation
- **Migrations**: Knex.js migration system
- **Seeds**: Development and E2E test data
- **Relationships**: Foreign key constraints with proper indexing
- **Triggers**: Business logic enforcement (captain permissions, unique constraints)
- **Functions**: Utility functions like `get_account_id_from_steam_id`
- **Backups**: Automated daily backups with 7-day retention

## Key Patterns

### Error Handling

- **Controllers**: Use `return next(new ErrorClass("message"))`
- **Services/Models**: Throw errors and let them bubble up
- **Try/Catch**: Only for database transactions with cleanup
- **RFC 7807**: All errors formatted as Problem Details

### Type Safety

- **No Unsafe Casting**: Use `satisfies` operator and type guards
- **Separate Interfaces**: Raw database types vs processed application types
- **Validation**: Runtime type checking with Zod schemas

### Testing Strategy

- **Unit Tests**: Fast Jest tests for business logic
- **E2E Tests**: Playwright tests with real backend
- **TDD Workflow**: Write tests first, then implementation
- **Test Utilities**: Centralized setup with `createExpressTestApp`

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
- **Backups**: Automated daily backups with retention

## Security Considerations

- **JWT Tokens**: RSA-signed access and refresh tokens
- **CORS**: Configured for frontend domain
- **Input Validation**: Zod schemas for all API inputs
- **SQL Injection**: Knex.js query builder prevents SQL injection

## Performance

- **Database Indexing**: Proper indexes on foreign keys and search columns
- **Query Optimization**: Efficient database queries with proper joins
- **Caching**: Redis for session management
- **Frontend**: Next.js optimizations (SSR, code splitting)

## Monitoring

- **Logging**: Structured logging with appropriate levels
- **Error Tracking**: RFC 7807 error responses for debugging
- **Database Monitoring**: Query performance and connection pooling
- **Health Checks**: API endpoints for service health monitoring
