# Active Context - Kanaliiga Eggosystem

## Current Work Focus

### Recent Restructuring (January 2025)

- **Memory Bank Migration**: Moving project context from rules to memory-bank folder structure
- **Rule Optimization**: Separating behavioral rules from project context documentation
- **Documentation Consolidation**: Centralizing all project knowledge in structured memory bank

### Active Priorities

1. **Memory Bank Implementation**: Complete migration from rule-based context to memory-bank structure
2. **Rule Cleanup**: Simplify cursor rules to contain only behavioral guidance
3. **Context Organization**: Establish clear hierarchy and relationships between memory bank files

## Recent Changes

### Completed

- ✅ Created memory-bank.mdc rule following polarsquad/ecoestate pattern
- ✅ Established memory-bank folder structure with core files
- ✅ Migrated project context from rules to memory bank documents
- ✅ Defined proper file hierarchy and relationships

### In Progress

- 🔄 Finalizing memory bank structure and content
- 🔄 Cleaning up existing rule files to remove duplicated context
- 🔄 Establishing progress tracking and active context documentation

### Type Management Improvements

Refactored the `sortter.models.ts` file by:

1. Moving interface definitions to the shared `packages/types` package under `/sortter`
2. Renaming the generic `TeamValue` interface to the more descriptive `TeamSortterValues`
3. Adding a separate `TeamSortterValuesRaw` interface for raw database results
4. Implementing proper JSON parsing with type safety using the `satisfies` operator
5. Adding comprehensive JSDoc comments to document the purpose of each property

This change established a pattern for handling database types that should be followed in future development:

- Domain-specific type definitions should live in the shared types package
- Raw database result types should be separated from application types
- Type transformations should be explicit and type-safe
- The `satisfies` operator should be used to validate type conformance

The pattern is now documented in the SystemPatterns.md file under "Type Management Patterns".

## Next Steps

### Immediate (This Session)

1. **Complete Memory Bank Setup**

   - Create progress.md to track current project status
   - Validate all memory bank files are complete and accurate
   - Test memory bank structure with actual development work

2. **Rule Cleanup**
   - Remove project context from existing rule files
   - Keep only behavioral guidance in rules
   - Update rule descriptions and glob patterns

### Short Term (Next Few Sessions)

1. **Memory Bank Refinement**

   - Add any missing technical patterns or context
   - Create additional specialized documentation as needed
   - Establish update workflows for memory bank maintenance

2. **Development Workflow Integration**
   - Test memory bank effectiveness with actual coding tasks
   - Refine context based on practical usage
   - Document learnings and improvements

## Active Decisions & Considerations

### Memory Bank Structure

- **File Organization**: Following proven pattern from polarsquad/ecoestate
- **Content Hierarchy**: Clear progression from project brief → technical details → active work
- **Update Strategy**: Focus on activeContext.md and progress.md for current state tracking

### Rule vs Memory Bank Separation

- **Rules**: Behavioral guidance, response patterns, technical conventions
- **Memory Bank**: Project context, technical details, system patterns
- **Boundary**: Rules define HOW to work, Memory Bank defines WHAT we're working on

### Documentation Strategy

- **Single Source of Truth**: Memory bank contains all project context
- **Version Control**: Track changes to memory bank through git
- **Maintenance**: Regular updates as project evolves

## Important Patterns & Preferences

### Development Approach

- **Context-First**: Always read memory bank before starting work
- **Pattern Consistency**: Follow established patterns in systemPatterns.md
- **Mobile-First**: All features must work on mobile devices
- **Data Integrity**: Maintain correct database relationships and queries

### Code Quality Standards

- **TypeScript Strict**: No any types, proper interfaces
- **Test Coverage**: Comprehensive testing with error detection
- **Performance**: Sub-second response times for most operations
- **Documentation**: Clear, current documentation for all features

## Learnings & Project Insights

### Key Discoveries

1. **PlayerStats Relationships**: Critical importance of correct JOIN patterns
2. **Team Associations**: SeasonTeamPlayers is source of truth, not TeamRosters
3. **Mobile Performance**: Essential data only on small screens improves UX
4. **Filter Architecture**: parseQueryFilterParams middleware enables consistent filtering

### Technical Debt Awareness

- **Complex Database Queries**: Need careful optimization for performance
- **Mobile Table Design**: Ongoing refinement of what data is essential
- **Error Handling**: Consistent patterns across frontend and backend
- **Testing Strategy**: Balance between comprehensive coverage and development speed

### Success Factors

- **Consistent Patterns**: Following established patterns reduces bugs
- **Documentation**: Good documentation enables faster development
- **Mobile-First**: Designing for mobile improves overall UX
- **Performance Focus**: Fast queries essential for good user experience

## Context Update Strategy

### When to Update Memory Bank

1. **After Major Features**: Document new patterns and learnings
2. **Architecture Changes**: Update technical context and system patterns
3. **User Requests**: When explicitly requested to update memory bank
4. **Pattern Discovery**: When finding new effective approaches

### Focus Areas for Updates

- **activeContext.md**: Current work, recent changes, next steps
- **progress.md**: Project status, completed features, remaining work
- **systemPatterns.md**: New technical patterns and best practices
- **productContext.md**: Evolving user needs and feature priorities

## Current Focus: Frontend Unit Testing Setup & Email Verification

### Recent Accomplishments

**Frontend Unit Testing Implementation (January 2025)**

- ✅ **Added Jest + React Testing Library** to frontend for comprehensive unit testing
- ✅ **Configured Jest** with Next.js integration, coverage reporting, and CI integration
- ✅ **Fixed TypeScript errors** by adding proper Jest DOM type declarations
- ✅ **Updated GitLab CI** to run frontend unit tests alongside integration and E2E tests
- ✅ **Established testing hierarchy**: Unit (Jest) → Integration (Playwright) → E2E (Playwright)

**Email Verification Toast Fix (January 2025)**

- ✅ Fixed server-side toast error by moving toast notifications to client components
- ✅ Updated `VerifyEmailSuccessButton` to handle success toasts with `showSuccessToast` prop
- ✅ Maintained clean separation between server and client components

**Email Template Styling Fix**

- ✅ Fixed "Verify Email" button centering in email template using table-based layout
- ✅ Improved email client compatibility (especially Outlook) with `<table>` instead of `<div>`
- ✅ Applied email HTML best practices for reliable cross-client rendering

**Comprehensive Email Verification Test Suite**

- ✅ Created 14 backend tests covering all scenarios (success, validation, expiration, errors, edge cases)
- ✅ Created frontend E2E tests with Playwright for UI behavior
- ✅ Followed TDD workflow principles throughout

**Important Error Handling Discovery**

- ✅ Learned that Redis operations in this codebase do NOT throw errors requiring try/catch
- ✅ Confirmed that `redisClient.get()` and `redisClient.del()` return null/undefined on errors rather than throwing
- ✅ Updated error handling to only use try/catch where actually needed (JSON.parse, data validation)
- ✅ Removed unrealistic tests that assumed Redis throws errors
- ✅ **Corrected misleading try/catch comment** - clarified that try/catch is for JSON.parse() and database operations, not Redis

**Critical Test Structure Discovery**

- ✅ **Integration Tests** (`test:integration`) should MOCK all API calls and NOT require backend
- ✅ **E2E Tests** (`test:e2e`) should use REAL backend and test complete user flows
- ✅ Moved verify-email tests from `/integration/` to `/e2e/` folder (they test full page navigation)
- ✅ Fixed test helper functions to remove unnecessary try/catch blocks (Playwright has built-in retry)
- ✅ Understanding: ECONNREFUSED errors indicate tests are in wrong category

### Key Patterns Discovered

**Frontend Unit Testing Architecture**

- **Jest + React Testing Library**: Fast, isolated component testing with proper mocking
- **Test Organization**: `/src/__tests__/unit/` for Jest, `/integration/` and `/e2e/` for Playwright
- **TypeScript Integration**: Import `@testing-library/jest-dom` in type declaration file
- **CI Integration**: Separate `test:frontend:unit` and `test:frontend:integration` jobs
- **Coverage Reporting**: Cobertura format for GitLab CI integration

**E2E Testing & Database Management Patterns**

- **CRITICAL**: E2E tests modify database state (consume tokens, create records, etc.)
- **Database Reset Workflow**: Always run `reseed → seed → seed:e2e` before/after E2E test runs
- **Test Isolation**: Create multiple test tokens/data in seeds to prevent conflicts between parallel tests
- **Command Pattern**: `pnpm run reseed && pnpm run seed && pnpm run seed:e2e`
- **Real Backend Usage**: E2E tests should use real backend, not mocked APIs
- **State Contamination**: Successful operations in tests consume database resources (email tokens, registrations)

**Lucide React Icon Testing Patterns**

- **Auto-generated Classes**: Lucide React generates classes like `lucide-circle-check-big` and `lucide-circle-x`
- **data-testid Issue**: data-testid attributes don't propagate to SVG elements in Lucide icons
- **Selector Strategy**: Use actual auto-generated Lucide classes rather than manual classes
- **Component Cleanup**: Remove conflicting manual Lucide classes, let React generate proper classes
- **Debug Approach**: Use comprehensive DOM inspection to discover actual rendered element structure

**Error Handling Rule Application**

- Use try/catch only for: JSON.parse(), data validation, database operations, external API calls
- DON'T use try/catch for: Redis operations, Playwright navigation, simple validation
- Follow existing codebase patterns rather than adding unnecessary error handling
- **Be precise in comments** - explain the actual error boundaries, not assumptions

**Email Template Best Practices**

- Use table-based layout for button centering: `<table><tr><td style="text-align:center">`
- Avoid `<div>` with CSS for critical layout in emails (poor client support)
- Test across email clients, especially Outlook which ignores modern CSS

**Test Organization**

```
/src/__tests__/integration/  → Mock all APIs, no backend required
/src/__tests__/e2e/         → Real backend, full application flows
/src/__tests__/unit/        → Component testing (if needed)
```

**Playwright Best Practices**

- Use built-in timeout and retry mechanisms instead of custom try/catch retry loops
- Simple navigation helpers: `page.goto()` with timeout settings
- Let Playwright handle connection errors naturally

## Backend Testing Enhancement Needs

### Missing Test Infrastructure (Based on Node.js Best Practices)

**Backend Unit Testing Setup**

- ❌ **Missing Jest configuration** for backend unit tests (`apps/backend/jest.config.js`)
- ❌ **No test organization structure** - need `__tests__` folders alongside source files
- ❌ **Missing mocking setup** for database, Redis, and external services
- ❌ **No test data factories** for consistent test data creation
- ❌ **Missing performance testing** patterns for query response times

**Test Coverage Gaps**

- ❌ **Controller unit tests** - missing Supertest integration testing
- ❌ **Service layer tests** - business logic testing with mocked dependencies
- ❌ **Model/Query tests** - database query logic testing with mocked DB
- ❌ **Error scenario testing** - comprehensive error handling validation
- ❌ **API schema validation** - response structure consistency testing

**Mocking Strategy**

- ❌ **Database mocking** - need patterns for unit testing without real DB
- ❌ **Redis mocking** - proper Redis client mocking for caching tests
- ❌ **External service mocking** - Steam API and other external dependencies
- ❌ **Clean mock patterns** - beforeEach/afterEach cleanup strategies

**Performance & Quality**

- ❌ **Response time testing** - ensure sub-second query performance
- ❌ **Snapshot testing** - API response structure consistency
- ❌ **Integration testing** - controller → service → model testing with real DB
- ❌ **Test environment setup** - proper test database seeding/cleanup

### Priority Implementation Order

1. **Jest Configuration** - Set up `apps/backend/jest.config.js` with proper Node.js environment
2. **Test Organization** - Create `__tests__` folders and establish file structure patterns
3. **Mocking Infrastructure** - Database, Redis, external service mocking patterns
4. **Controller Testing** - Supertest integration with proper request/response validation
5. **Service Layer Testing** - Business logic with mocked dependencies
6. **Performance Testing** - Query response time boundaries and monitoring

### Key Node.js Testing Best Practices to Implement

**From goldbergyoni/nodejs-testing-best-practices:**

- **Clean mocking with type safety** - Use proper TypeScript mocking patterns
- **Test data factories** - Consistent, reusable test data creation
- **Avoid partial mocks** - Mock entire modules or objects, not individual functions
- **Performance boundaries** - Test that queries meet performance requirements
- **Error scenario coverage** - Test all failure paths and edge cases
- **Mock cleanup** - Always reset mocks between tests to prevent interference

## Node.js Testing Strategy Gaps (Critical)

### Strategic Testing Approach Missing

**❌ Testing Diamond vs Testing Pyramid**

- Current approach: Traditional pyramid (many units → fewer integration → few E2E)
- **Should be**: Testing Diamond (few units → MANY component/integration → few E2E)
- **Gap**: We're not prioritizing component tests as the primary testing strategy

**❌ Component-First Testing Philosophy**

- **Missing**: "Always START with integration/component tests" principle
- **Gap**: No clear guidance on testing entire microservice/component through API
- **Should prioritize**: Full component testing with real database, mocked externals only

**❌ Feature-Based Testing Focus**

- **Missing**: "Cover features, not functions" approach
- **Gap**: No emphasis on testing API routes and business workflows first
- **Should focus**: Test complete user journeys and API endpoints, not individual functions

### Database & Infrastructure Testing Gaps

**❌ Optimized Database Setup for Testing**

- **Missing**: Database optimization patterns for fast test execution
- **Gap**: No guidance on test database setup, seeding strategies, isolation patterns
- **Need**: Database setup that supports "40 tests in 5 seconds" performance

**❌ Data Isolation Strategies**

- **Missing**: Patterns for test data management and cleanup
- **Gap**: No clear approach to prevent test data conflicts
- **Need**: Proper data isolation between tests without full database resets

### Integration Testing Gaps

**❌ Third-Party Service Testing**

- **Missing**: Strategies for testing external API integrations
- **Gap**: No patterns for contract testing, service virtualization
- **Need**: Approaches for testing Steam API, other external services

**❌ Message Queue Testing**

- **Missing**: If we use any async messaging, queue testing patterns
- **Gap**: No guidance on testing event-driven workflows

### Web Server Testing Setup

**❌ Proper Server Lifecycle Management**

- **Missing**: Best practices for starting/stopping backend in tests
- **Gap**: No patterns for test server setup and teardown
- **Need**: Efficient server startup for integration testing

### Test Anatomy & Quality

**❌ Advanced Test Structure Patterns**

- **Missing**: Proper test naming, structure, and organization principles
- **Gap**: No guidance on test readability and maintainability
- **Need**: Clear patterns for test organization and documentation

### Priority Implementation Strategy

**IMMEDIATE (Testing Philosophy Shift):**

1. **Adopt Testing Diamond**: Start with component/integration tests, not unit tests
2. **Feature-First Testing**: Focus on API endpoints and business workflows
3. **Database-Included Testing**: Test with real database, mock only externals

**SHORT-TERM (Infrastructure):**

1. **Optimized Test Database**: Fast, isolated database setup for testing
2. **Component Test Framework**: Full backend testing through API endpoints
3. **External Service Mocking**: Proper third-party integration testing

**MEDIUM-TERM (Advanced Patterns):**

1. **Performance Testing**: Query response time monitoring and boundaries
2. **Data Management**: Advanced seeding, cleanup, and isolation strategies
3. **Contract Testing**: API contract validation and external service contracts

**Critical Insight**: The guide emphasizes that **component/integration tests should be the primary testing strategy**, not unit tests. This is a fundamental shift from traditional testing pyramid thinking.

## Recent Changes & Updates

### Documentation Updates

- **shadcn/ui Integration**: Added comprehensive documentation for shadcn/ui component library usage
  - Component patterns and best practices in `systemPatterns.md`
  - Technical setup and configuration in `techContext.md`
  - Form handling, accessibility, and testing patterns
  - CSS variable theming and customization approaches

## Recent Feature Implementation: Team Value Sorter

### Feature Overview

- ✅ **Team Value Sorter API**: New backend endpoint to support team value comparison functionality
- ✅ **Endpoint Path**: `/api/v1/sortter/season/:season_id` and `/api/v1/sortter/season/:season_id/team/:team_id`
- ✅ **Data Structure**: Returns team name, sum of top 5 players' kanaelo, average of top 4 players' kanaelo, team league, and individual kanaelo values
- ✅ **Implementation**: Uses SQL queries to calculate values from player_kanaelo table

### Development Process

- ✅ **TDD Approach**: Started with tests first, followed by implementation
- ✅ **SQL Optimization**: Implemented efficient queries for calculating team value metrics
- ✅ **Naming Convention**: Renamed from "team-values" to "sortter" for consistency with frontend naming
- ✅ **Integration Testing**: Verified values match expected calculations (e.g., CSKeisari returns top5_sum=1418, avg4=288.750)

### Technical Implementation

- **SQL Query Pattern**: Uses `WITH` clause to create temporary result sets for efficiency
- **Aggregation Logic**:
  - Calculates sum of top 5 players' kanaelo
  - Calculates average of top 4 players' kanaelo
  - Includes individual player kanaelo values
- **TypeScript Return Types**: Proper typing for all returned data

### Learnings

- **Naming Consistency**: Importance of consistent naming between frontend and backend
- **SQL Optimization**: Effective use of `WITH` clause for complex calculations
- **TDD Benefits**: Tests guided implementation and verified calculations
- **File Organization**: Proper structure with models, controllers, routes, and tests
