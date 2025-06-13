# Technical Context - Kanaliiga Eggosystem

## Technology Stack

### Monorepo Structure

- **Root**: PNPM workspace configuration
- **apps/backend**: Node.js/TypeScript API server
- **apps/frontend**: Next.js/TypeScript web application
- **packages/**: Shared utilities and configurations

### Backend Technologies

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Query Builder**: Knex.js with migrations
- **API Design**: RESTful endpoints with structured responses

### Frontend Technologies

- **Framework**: Next.js with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Icons**: Lucide React
- **Data Fetching**:
  - `expressFetcher` for non-authenticated requests
  - `clientApiFetch` for authenticated requests with JWT
- **State Management**: React hooks and SWR cache
- **Animation**: Framer Motion
- **Theme**: next-themes for dark/light mode support
- **Form Handling**: React Hook Form with Zod validation

#### shadcn/ui Configuration

**Core Setup**:

- **Style**: "new-york" theme variant
- **Base Color**: Zinc color palette
- **Icons**: Lucide React icon library
- **CSS Variables**: Enabled for dynamic theming
- **Components Path**: `@/components/ui`

**Installed Components**:

- **Layout**: Sidebar, Accordion, Tabs, Card, Separator
- **Navigation**: Navigation Menu, Breadcrumb, Dropdown Menu, Sheet
- **Forms**: Button, Input, Textarea, Label, Checkbox, Select, Form
- **Feedback**: Badge, Skeleton, Sonner (Toast), Dialog, Tooltip, Popover
- **Data**: Command (Command Palette)

**Key Dependencies**:

- **@radix-ui**: Unstyled, accessible component primitives
- **class-variance-authority**: Type-safe component variants
- **tailwind-merge**: Intelligent Tailwind class merging
- **cmdk**: Command palette functionality

**Add New Components**:

```bash
cd apps/frontend && pnpm shadcn:add [component-name]
```

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
- **Filter Types**: season_ids, league_ids, team_ids, stages, map_ids

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

- **Backend**: Jest unit tests for models, integration tests for controllers
- **Frontend Unit**: Jest + React Testing Library for component testing
- **Frontend Integration**: Playwright tests with mocked APIs
- **Frontend E2E**: Playwright tests with real backend
- **Database**: Separate test database with proper cleanup
- **Performance**: Query performance monitoring

**Backend Testing Gap**: Currently missing comprehensive Jest unit testing setup for backend. Need to implement:

- Jest configuration for Node.js environment
- Mocking patterns for database, Redis, external services
- Controller testing with Supertest
- Service layer unit tests with mocked dependencies
- Performance boundary testing
- Following Node.js testing best practices from goldbergyoni/nodejs-testing-best-practices

## Deployment & Infrastructure

### Environment Configuration

- **Development**: DevContainer with all dependencies
- **Database**: PostgreSQL with migration system
- **Build Process**: Turbo for efficient monorepo builds
- **Package Management**: PNPM workspaces for dependency management

### Performance Requirements

- **Query Response**: Sub-second response times for most operations
- **Mobile Performance**: Optimized for mobile devices
- **Data Integrity**: Consistent statistical calculations
- **Scalability**: Handle growing datasets efficiently

## Technical Constraints

### Database Constraints

- **Complex Joins**: PlayerStats requires specific join patterns
- **Team Relationships**: Dynamic team-player associations per season
- **Data Volume**: Large datasets require optimized queries
- **Historical Data**: Long-term storage and efficient access

### Frontend Constraints

- **Mobile-First**: All features must work on mobile
- **Performance**: Fast loading despite complex data
- **State Management**: Efficient data fetching and caching
- **Browser Support**: Modern browser compatibility

### Development Constraints

- **Monorepo**: Coordinated changes across frontend/backend
- **TypeScript**: Strict typing requirements
- **DevContainer**: Development environment consistency
- **Testing**: Comprehensive test coverage requirements

### Frontend Architecture

- **Framework**: Next.js with App Router
- **State Management**: SWR for data fetching and caching
- **Data Fetching**:
  - `expressFetcher` for non-authenticated requests
  - `clientApiFetch` for authenticated requests with JWT
- **Component Library**: shadcn/ui with Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **Testing**: Jest + React Testing Library
