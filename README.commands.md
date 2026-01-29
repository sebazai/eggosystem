# Development Commands

This document provides a comprehensive reference for all development commands in the Kanaliiga Eggosystem.

## Package Management

### Root Workspace Commands

```bash
# Install all dependencies across workspace
pnpm install

# Build all packages and apps
pnpm build

# Run all tests (unit tests only)
pnpm test

# Run all tests including E2E
pnpm test:all

# Run E2E tests only
pnpm test:e2e

# Start development environment
pnpm dev
```

### Backend Commands (from `apps/backend/`)

```bash
# Development server
pnpm dev

# E2E test backend (stubbed)
pnpm dev:e2e

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format

# Database migration
pnpm migrate

# Database seed
pnpm seed

# Database reset and seed
pnpm seed:reset
```

### Frontend Commands (from `apps/frontend/`)

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format

# E2E tests
pnpm test:e2e

# Integration tests (Jest unit tests)
pnpm test
```

## Database Commands

**Schema Reference**: See `README.database.md` for complete database schema documentation including triggers, functions, and relationships.

### Migration Commands

```bash
# Create new migration
pnpm migrate:make <migration_name>

# Run pending migrations
pnpm migrate

# Rollback last migration
pnpm migrate:rollback

# Check migration status
pnpm migrate:status
```

### Seed Commands

```bash
# Run development seed
pnpm seed

# Run E2E test seed
pnpm seed:e2e

# Reset and seed database
pnpm seed:reset

# Update dev seed (after migrations)
pnpm seed:update
```

## Testing Commands

### Unit Testing

```bash
# Run all unit tests
pnpm test

# Run tests for specific app
pnpm --filter=backend test
pnpm --filter=frontend test

# Run specific test file
pnpm test -- <test_file_path>

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage (built into test command)
pnpm test
```

### E2E Testing

```bash
# Run E2E tests (requires backend setup)
pnpm test:e2e

# Run E2E tests in headed mode
pnpm test:e2e -- --headed

# Run specific E2E test
pnpm test:e2e -- <test_file_path>
```

### Integration Testing

```bash
# Run integration tests (Jest unit tests)
pnpm test

# Run specific test file
pnpm test -- <test_file_path>
```

## Quality Assurance Commands

### Code Quality

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Linting with auto-fix
pnpm lint:fix

# Code formatting
pnpm format

# Format check (CI)
pnpm format:check
```

### Build Commands

```bash
# Build all packages
pnpm build

# Build specific app
pnpm --filter=backend build
pnpm --filter=frontend build

# Build types package
pnpm --filter=types build

# Clean build artifacts
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

# Access PhpMyAdmin
# http://localhost:8082 (docker compose)
# http://localhost:8083 (devcontainer)

# Database backup
docker compose exec eggo-db-backup /bin/bash -c 'mysql-backup dump --server $DB_SERVER --user $DB_USER --pass $DB_PASS --target $DB_DUMP_TARGET'
```

## JWT Key Generation

```bash
# Generate access token keys
openssl genpkey -algorithm RSA -out apps/backend/private_access_token.pem
openssl rsa -pubout -in apps/backend/private_access_token.pem -out apps/backend/public_access_token.pem

# Generate refresh token keys
openssl genpkey -algorithm RSA -out apps/backend/private_refresh_token.pem
openssl rsa -pubout -in apps/backend/private_refresh_token.pem -out apps/backend/public_refresh_token.pem
```

## Playwright Setup

```bash
# Install Playwright browsers (chromium only)
pnpm exec playwright install chromium

# Install system dependencies (chromium only)
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

```bash
# Run command for specific workspace
pnpm --filter=backend <command>
pnpm --filter=frontend <command>
pnpm --filter=types <command>

# Run command for multiple workspaces
pnpm --filter=backend --filter=frontend <command>
```

### Parallel Execution

```bash
# Run commands in parallel
pnpm --parallel <command>

# Run tests in parallel
pnpm --parallel test
```

### Workspace Root Commands

```bash
# Always run from workspace root for cross-package operations
cd $(git rev-parse --show-toplevel) && pnpm <command>

# Backend-specific commands
cd $(git rev-parse --show-toplevel)/apps/backend && pnpm <command>

# Frontend-specific commands
cd $(git rev-parse --show-toplevel)/apps/frontend && pnpm <command>
```

## Troubleshooting

### Common Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install

# Reset database
pnpm seed:reset

# Clear build artifacts
pnpm clean
pnpm build

# Check workspace status
pnpm list --depth=0
```

### Environment Issues

```bash
# Check environment variables
env | grep -E "(NODE_ENV|DATABASE|JWT)"

# Verify database connection
pnpm --filter=backend migrate:status

# Check service health
curl http://localhost:3001/health
curl http://localhost:3000
```
