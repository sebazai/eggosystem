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
