# Kanaliiga Kanahub

> **Eggosystem for Kanaliiga Hub** - A comprehensive esports tournament management platform

## Highlights

- **CS2 Tournament Management**: Complete tournament system with team registration, player management, and match tracking
- **Advanced Player Analytics**: Comprehensive CS2 demo parser with KanaRating system, detailed statistics, and performance metrics
- **Role-based Access Control**: Sophisticated permission system with captain permissions, team management, and admin controls
- **Database-driven Business Logic**: MariaDB with triggers and functions enforcing tournament rules and data integrity
- **Modern Development Stack**: TypeScript, Next.js, Express.js with full type safety and comprehensive testing
- **Professional UI**: Responsive design with Tailwind CSS, Radix UI components, and dark/light theme support
- **Automated Workflows**: Database backups, migration system, and comprehensive CI/CD pipeline

## Quick Start

### Prerequisites

- Docker and Docker Compose
- VS Code with Dev Containers extension (recommended)
  - **Note**: DevContainer still requires Docker to be installed and running on your host machine

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd eggosystem
   ```

2. **Start development environment**

   ```bash
   # Option 1: DevContainer (Recommended)
   # Open in VS Code and select "Reopen in Container"

   # Option 2: Docker Compose
   docker compose up
   ```

3. **Initialize database**

   ```bash
   pnpm seed
   ```

4. **Start development servers**
   ```bash
   pnpm dev
   ```

**You're ready!** Backend runs on `localhost:3001`, frontend on `localhost:3000`

## Documentation

- **[Architecture Overview](README.architecture.md)** - System design and technical patterns
- **[Backend API Documentation](README.api.md)** - API endpoints, authentication, and security patterns
- **[Database Schema](README.database.md)** - Complete database documentation with triggers and functions
- **[Development Commands](README.commands.md)** - Comprehensive command reference
- **[Dashboard Security](README.dashboard.md)** - Dashboard authentication, authorization, and security patterns
- **[Frontend Development](README.frontend.md)** - Frontend component patterns, responsive design, and data fetching
- **[Testing Strategy](README.testing.md)** - Testing patterns and best practices

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

# Start with database seeding
docker compose --profile seed up
```

This starts the complete development environment including:

- Backend API server (localhost:3001)
- Frontend application (localhost:3000)
- MariaDB database with PhpMyAdmin
- Redis for session management
- Automated test execution

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
# Install Playwright dependencies
pnpm exec playwright install
pnpm exec playwright install-deps

# Start E2E backend
pnpm --filter=backend dev:e2e

# Run E2E tests
pnpm test:e2e
```

**Note**: For macOS with DevContainer, install XQuartz and run `xhost localhost` in XQuartz terminal for Playwright headed mode.

## Database Management

### Migrations

When creating new migrations, remember to [update the dev/test seed](docs/update_dev_seed.md).

For production migrations, see [migration documentation](docs/migration.md).

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
