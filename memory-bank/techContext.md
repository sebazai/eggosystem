# Technical Context - Kanaliiga Eggosystem

## Technology Stack

### Backend (Node.js/Express)

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Knex.js ORM
- **Authentication**: JWT with Steam OAuth
- **Caching**: Redis for session management
- **Email**: Nodemailer with SMTP
- **Testing**: Jest for unit testing

### Frontend (Next.js)

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: SWR for data fetching
- **Authentication**: Client-side JWT handling
- **Testing**: Jest + React Testing Library for unit testing, Playwright for e2e testing

### Development Environment

- **Containerization**: DevContainer configuration
- **Package Manager**: PNPM for efficient monorepo management
- **Build Tool**: Turbo for monorepo builds
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

## Database Architecture

### Schema Location

- **Documentation**: `docs/database.md`
- **Migrations**: `apps/backend/migrations/20250127080330_database_schema.ts`

### Key Relationships

- **Many-to-Many**: SeasonLeagues connects Seasons and Leagues
- **Player Statistics**: PlayerStats → MatchGames → Matches (critical join pattern)
- **Player-Team Relations**: SeasonTeamPlayers table (not TeamRosters)
- **Hierarchical Data**: Seasons → Leagues → Matches → Games → PlayerStats

### Performance Considerations

- **Indexing**: Strategic indexes on foreign keys and filtered columns
- **Query Optimization**: Careful JOIN strategies for large datasets
- **Caching**: SWR caching on frontend, query result caching potential

## API Architecture

### Frontend-Backend Integration

- **Proxy Pattern**: Frontend API routes at `apps/frontend/src/app/api/v1/...`
- **Request Forwarding**: All query parameters preserved to backend
- **Error Handling**: Consistent error responses across all endpoints

### Middleware System

- **Filtering**: `parseQueryFilterParams` middleware for all filter endpoints
- **Parameter Structure**: Controllers access `req.parsedParams` (ParsedParams interface)
- **Filter Types**:
  - season_ids (number[])
  - league_ids (number[])
  - team_ids (number[])
  - stages (number[]) - where 1 = "Regular", 2 = "Playoffs"
  - map_ids (number[])

### Data Flow

```
Frontend Component → SWR Hook → Frontend API Route → Backend API → Database
```

## Development Patterns

### Code Style Conventions

- **Consistency**: Match existing patterns in codebase
- **TypeScript**: Strict typing with proper interfaces
- **Error Handling**: Consistent error responses and logging
- **Documentation**: Markdown format for all documentation

### Testing Strategy

- **Backend**: Jest unit tests for models, services, and controllers
- **Frontend Unit**: Jest + React Testing Library for component testing
- **Frontend E2E**: Playwright for multi-component testing with real backend
- **Test Organization**: Unit tests alongside source files, e2e tests in dedicated folders
- **CI Integration**: Automated testing in GitLab CI

## Key Dependencies

### Backend Dependencies

- **Express**: Web framework
- **Knex.js**: SQL query builder
- **JWT**: Authentication tokens
- **Redis**: Session caching
- **Nodemailer**: Email sending
- **Jest**: Testing framework

### Frontend Dependencies

- **Next.js**: React framework
- **React**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **shadcn/ui**: Component library
- **SWR**: Data fetching
- **Jest**: Testing framework
- **React Testing Library**: Component testing
- **Playwright**: E2E testing framework

### Shared Dependencies

- **TypeScript**: Type definitions
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Configuration Files

### Backend Configuration

- **package.json**: Dependencies and scripts
- **tsconfig.json**: TypeScript configuration
- **jest.config.js**: Testing configuration
- **knexfile.js**: Database configuration
- **.env**: Environment variables

### Frontend Configuration

- **package.json**: Dependencies and scripts
- **tsconfig.json**: TypeScript configuration
- **jest.config.js**: Testing configuration
- **tailwind.config.js**: Styling configuration
- **next.config.js**: Next.js configuration

### Workspace Configuration

- **package.json**: PNPM workspace configuration
- **.gitignore**: Version control exclusions
- **docker-compose.yml**: Development environment

## Development Patterns

### Code Organization

- **Feature-Based**: Organize by feature rather than type
- **Shared Types**: Use packages/types for common interfaces
- **Middleware**: Express middleware for cross-cutting concerns
- **Services**: Business logic in service layer

### Error Handling

- **Consistent Patterns**: Standard error response format
- **Validation**: Input validation with proper error messages
- **Logging**: Structured logging for debugging
- **Client Handling**: Proper error states in frontend

### Performance

- **Database Queries**: Optimized with proper indexing
- **Caching**: Redis for frequently accessed data
- **Frontend**: Efficient data fetching with SWR
- **Mobile**: Responsive design with essential data only

## Testing Infrastructure

### Backend Testing

- **Jest Configuration**: Proper setup for Node.js environment
- **Database Testing**: Test database with migrations and seeding
- **Mocking**: Mock external services and dependencies
- **Coverage**: Test coverage reporting

### Frontend Testing

- **Jest + React Testing Library**: Component testing setup
- **TypeScript Integration**: Proper type checking in tests
- **Mocking**: Mock hooks, API calls, and external dependencies
- **Accessibility**: Test components with accessibility in mind
- **Playwright**: E2E testing for multi-component workflows
- **Standalone Server**: E2E tests use standalone build for consistency
- **Backend Requirements**: E2E tests require backend running with `pnpm --filter=backend dev:e2e`
- **Response Stubbing**: Stub external API responses in backend endpoints for e2e tests

### Testing Patterns

- **Unit Tests**: Test individual functions and components
- **E2E Tests**: Test complete user workflows with real backend
- **Mock Strategy**: Mock external dependencies in unit tests, use real backend in e2e tests
- **User-Centric**: Test from user perspective
- **Error States**: Test error handling and edge cases
- **Backend Integration**: E2E tests require backend running with external API stubbing
- **Monorepo E2E**: Use `pnpm test:e2e` from root for complete setup and execution

## Deployment & CI/CD

### GitLab CI

- **Pipeline**: Automated testing and deployment
- **Stages**: Test, build, deploy
- **Environments**: Development, staging, production
- **Artifacts**: Build artifacts and test reports

### Environment Management

- **Development**: Local development with DevContainer
- **Staging**: Pre-production testing environment
- **Production**: Live application environment
- **Configuration**: Environment-specific settings

## Security Considerations

### Authentication

- **JWT Tokens**: Secure token-based authentication
- **Steam OAuth**: Third-party authentication
- **Session Management**: Redis-based session storage
- **Authorization**: Role-based access control

### Data Protection

- **Input Validation**: Validate all user inputs
- **SQL Injection**: Use parameterized queries
- **XSS Prevention**: Sanitize user-generated content
- **CORS**: Proper cross-origin resource sharing

### Environment Security

- **Environment Variables**: Secure configuration management
- **Database Access**: Proper database permissions
- **API Security**: Rate limiting and request validation
- **HTTPS**: Secure communication in production

## Performance Optimization

### Database Performance

- **Query Optimization**: Efficient SQL queries with proper JOINs
- **Indexing**: Strategic database indexing
- **Connection Pooling**: Efficient database connections
- **Query Logging**: Performance monitoring

### Frontend Performance

- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Optimized image loading
- **Caching**: Browser and CDN caching
- **Bundle Size**: Minimized JavaScript bundles

### Monitoring

- **Error Tracking**: Production error monitoring
- **Performance Metrics**: Response time monitoring
- **User Analytics**: Usage pattern analysis
- **Health Checks**: Application health monitoring
