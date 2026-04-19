# Kanaliiga Eggosystem

Corporate CS2 esports tournament management platform for Kanaliiga Hub. PNPM workspace monorepo with an Express 5 backend, a Next.js 16 App Router frontend, and shared TypeScript packages.

## Highlights

- CS2 tournament management: team registration, rosters, match tracking.
- Player analytics: CS2 demo parser with the KanaRating system.
- Role-based access: captain permissions, team management, admin controls.
- Database-driven business rules: MariaDB with triggers and SQL functions.
- Shared TypeScript types and MSW mocks across apps via `@eggosystem/types` and `@eggosystem/shared-msw`.
- RFC 7807 Problem Details error format, JWT auth with RSA signing, Steam OpenID login.

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 24 (the DevContainer uses `mcr.microsoft.com/devcontainers/javascript-node:24-bullseye`)
- pnpm 10.33.0 (pinned via `packageManager` in root `package.json`)
- VS Code with Dev Containers extension (recommended). DevContainer still requires Docker on your host.

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd eggosystem
   ```

2. **Start development environment**

   ```bash
   # Option 1: DevContainer (recommended) — open in VS Code and "Reopen in Container"
   # Option 2: Docker Compose
   docker compose up
   ```

3. **Generate JWT keys** (see [JWT Key Generation](#jwt-key-generation) below).

4. **Apply for a Steam API key**: <https://steamcommunity.com/dev/apikey>.

5. **Create `apps/backend/.env`**

   ```env
   STEAM_API_KEY=your_api_key
   ```

6. **One-shot setup** (install deps, Playwright, build, migrate, seed):

   ```bash
   pnpm setup:dev
   ```

   Or step by step:

   ```bash
   pnpm install
   pnpm build
   pnpm migrate
   pnpm seed
   ```

7. **Start development servers**

   ```bash
   pnpm dev
   ```

Backend runs on `localhost:3001`, frontend on `localhost:3000`, bull-monitor on `localhost:3010`.

8. Optional: Apply for a FaceIT App Studio API key at <https://developers.faceit.com/> (most flows work without it).

9. Optional — **GitLab in Cursor (MCP)**: create a [Personal Access Token](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html) and a local `.env.mcp` file:

   ```bash
   pnpm gitlab:mcp:pat
   ```

   That command copies [`.env.mcp.example`](.env.mcp.example) to `.env.mcp` if needed, prints scope guidance, and opens the GitLab token page. Cursor loads `.env.mcp` via [`.cursor/gitlab-mcp.sh`](.cursor/gitlab-mcp.sh) (see [`.cursor/mcp.json`](.cursor/mcp.json)). Details: [Development Commands — GitLab MCP](README.commands.md#gitlab-mcp-cursor).

## Documentation

- [Architecture Overview](README.architecture.md) — system design and technical patterns
- [Backend API](README.api.md) — endpoints, authentication, security
- [Database Schema](README.database.md) — tables, triggers, SQL functions ([visual diagram](https://csdb.kanaliiga.fi/))
- [Development Commands](README.commands.md) — command reference
- [Dashboard Security](README.dashboard.md) — dashboard auth and authorization
- [Frontend Development](README.frontend.md) — component patterns and data fetching
- [Testing Strategy](README.testing.md) — Jest unit tests
- [Playwright / E2E](README.playwright.md) — end-to-end testing notes

### JWT Key Generation

Generate authentication keys for development:

```bash
# Generate access token keys
openssl genpkey -algorithm RSA -out apps/backend/private_access_token.pem
openssl rsa -pubout -in apps/backend/private_access_token.pem -out apps/backend/public_access_token.pem

# Generate refresh token keys
openssl genpkey -algorithm RSA -out apps/backend/private_refresh_token.pem
openssl rsa -pubout -in apps/backend/private_refresh_token.pem -out apps/backend/public_refresh_token.pem
```

### Alternative Setup

```bash
# Start all services with Docker Compose
docker compose up

# Start with the seed profile (runs dev_seed.ts once)
docker compose --profile seed up
```

This starts the complete development environment including:

- Backend API server (localhost:3001)
- Frontend application (localhost:3000)
- MariaDB database with PhpMyAdmin (localhost:8082)
- Redis for queues and caching
- bull-monitor UI on localhost:3010

## Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run backend tests only
pnpm --filter=backend test

# Run frontend tests only
pnpm --filter=frontend test

# Run specific test file
pnpm --filter=backend test -- leaderboards
```

### End-to-End Tests

```bash
# Install Playwright + system deps (chromium only)
pnpm install:playwright

# Run E2E tests (builds, reseeds the E2E DB, then runs Playwright)
pnpm test:e2e

# Playwright UI
pnpm test:e2e:ui

# Run a dedicated E2E backend (NODE_ENV=e2e, loads .env.local.test)
pnpm --filter=backend dev:e2e
```

Always run `pnpm test:e2e` from the workspace root so the build and E2E reseed run first; `test:e2e:run` skips those steps. For macOS with DevContainer, install XQuartz and run `xhost localhost` for Playwright headed mode.

## Database Management

### Migrations

When creating new migrations, remember to [update the dev/test seed](docs/update_dev_seed.md). See [`README.database.md`](README.database.md) for schema details and production migration notes.

### Database Access

#### Web Interface (PhpMyAdmin)

- **Docker Compose**: PhpMyAdmin at `localhost:8082`
- **DevContainer**: PhpMyAdmin at `localhost:8083`
- **Credentials**: `root` / `dev-pass`

### Automated Backups

The system automatically creates daily database backups at 04:00 using the databack/mysql-backup image.

**Features:**

- Daily automated backups at 04:00
- Gzip compression for efficient storage
- 7-day retention with automatic cleanup
- Complete database dumps for easy restoration

**Backup Format:** `db_backup_YYYY-MM-DDTHH:mm:ssZ.sql.gz`

**Manual Backup:**

```bash
docker-compose exec eggo-db-backup /bin/bash -c 'mysql-backup dump --server $DB_SERVER --user $DB_USER --pass $DB_PASS --target $DB_DUMP_TARGET'
```

**Restore from Backup:**

```bash
cd ./db-backup
zcat db_backup_YYYY-MM-DDTHH:mm:ssZ.sql.gz | docker-compose exec -T eggo-prod-db mysql -uroot -p${MARIADB_ROOT_PASSWORD}
```

For more information, see [databack/mysql-backup](https://github.com/databacker/mysql-backup).

## Architecture

### Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript, Knex.js
- **Database**: MariaDB with comprehensive triggers and functions
- **Authentication**: JWT with RSA signing
- **Testing**: Jest, Playwright, TDD workflow
- **Development**: DevContainer, Docker Compose, PNPM workspace

### Key Features

- **Type Safety**: Full TypeScript coverage with strict type checking
- **Error Handling**: RFC 7807 Problem Details format
- **Database Integrity**: Business logic enforced by triggers and constraints
- **Role-based Access**: Captain permissions and team management
- **CS2 Demo Parser**: Advanced analytics with KanaRating system and comprehensive statistics

## Contributing

We welcome contributions! Please see our development guidelines:

1. **Follow TDD**: Write tests first, then implementation
2. **Type Safety**: Use TypeScript with proper type guards
3. **Documentation**: Update relevant README files when making changes
4. **Code Quality**: All code must pass type checking, linting, and tests

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Write tests first (TDD approach)
4. Implement the feature
5. Update documentation
6. Submit a pull request

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Built for the esports community. Special thanks to all contributors and the open-source projects that make this possible.
