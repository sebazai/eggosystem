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
- ✅ Removed redundant nextFetcher.ts and updated to use expressFetcher/clientApiFetch pattern
- ✅ Fixed leaderboard rounds calculation by removing division by 2 in total_rounds SQL query
- ✅ Fixed type error in leaderboards test by using correct stage number format ([1] instead of ["group"])
- ✅ **Removed try/catch blocks from Kanahautomo controllers** - Controllers now let errors bubble up naturally
- ✅ **Updated controller tests** to use `await expect(...).rejects.toThrow()` for error cases instead of checking response status
- ✅ **Separated SQL Query Verification tests** into dedicated file for better test organization
- ✅ **Implemented Player Skill Metrics Diagram** with radar chart visualization of 5 key skill areas
- ✅ **Added Map Statistics for Teams and Players** with detailed performance breakdowns by map
- ✅ **Created Skill Comparison Feature** allowing players to compare with team average, similar ranked players, or all players
- ✅ **Fixed Team Filter in Player Skills** to correctly fetch and use player's team data for comparison
- ✅ **Fixed E2E Testing Configuration** - Updated package.json scripts and playwright.config.ts to allow running specific e2e test files
- ✅ **Fixed and Made Robust Kanahautomo E2E Tests** - All 7 tests now passing with comprehensive coverage

### In Progress

- 🔄 Finalizing memory bank structure and content
- 🔄 Cleaning up existing rule files to remove duplicated context
- 🔄 Establishing progress tracking and active context documentation
- Performance optimizations for player statistics loading
- Improving mobile responsiveness of match statistics page
- API response caching for frequently accessed endpoints

### Planned Features

- T/CT side toggle for player statistics in match view
  - Will allow filtering player stats by T-side or CT-side
  - Buttons will be positioned next to the "PLAYER" column header
  - Each team will have independent toggle state
  - Stats will update dynamically based on selected sides
  - Visual indicators will show which side is currently displayed

### Recent Challenges

### E2E Testing Strategy & Requirements (January 2025)

**CRITICAL E2E Testing Rules:**

1. **ALWAYS run e2e tests from monorepo root**: `cd $(git rev-parse --show-toplevel) && pnpm test:e2e`
   - This ensures proper database seeding (`reseed:e2e`, `seed`, `seed:e2e`)
   - Triggers necessary builds before running tests
   - **Note**: This does NOT start the `dev:e2e` backend - that's handled separately

2. **Boundary Value Testing Strategy**: Apply Test Boundary Analysis for robust tests
   - Test **minimum valid values** (e.g., 2-character organization names)
   - Test **maximum valid values** (e.g., maximum length strings)
   - Test **just below minimum** (e.g., 1-character names - should fail)
   - Test **just above maximum** (e.g., too-long strings - should fail)
   - Test **edge cases** (empty strings, null values, special characters)
   - Test **boundary transitions** (exactly at limits)

3. **Package/Types Build Requirement**:
   - **ALWAYS build packages/types after changes**: `cd $(git rev-parse --show-toplevel) && pnpm --filter=@eggosystem/types build`
   - Changes in `packages/types` don't automatically propagate to backend/frontend
   - Must explicitly build types package for changes to be visible

**E2E Test Quality Improvements Made:**

- ✅ **Better Element Selectors**: Used `button[role='combobox']` to avoid conflicts
- ✅ **API Request/Response Tracking**: Monitor actual API calls for debugging
- ✅ **Flexible Validation Testing**: Content matching instead of exact text selectors
- ✅ **Robust Success Verification**: API response status + form state changes
- ✅ **Comprehensive Coverage**: 7 test scenarios covering all major functionality
- ✅ **Error Handling**: Graceful handling of both success and failure cases

### Type Management Improvements

Refactored the `sortter.models.ts` file by:

1. Moving interface definitions to the shared `packages/types` package under `/sortter`
2. Renaming the generic `TeamValue` interface to the more descriptive `TeamSortterValues`
3. Adding a separate `TeamSortterValuesRaw` interface for raw database results
4. Implementing proper JSON parsing with type safety using the `satisfies` operator
5. Adding comprehensive JSDoc comments to document the purpose of each property

Most recently, implemented the indexed access types pattern in `PlayerSortterValues` interface:

1. Changed direct type definitions to indexed access types (e.g., `SeasonPlayerRank["cs2_rank"]`)
2. Clearly distinguished between database fields and calculated fields
3. Added comments to indicate which fields are calculated vs. direct database fields
4. Created a formal rule in `.cursor/rules/indexed-access-types.mdc` to enforce this pattern

This establishes key patterns for handling database types that should be followed in future development:

- Domain-specific type definitions should live in the shared types package
- Raw database result types should be separated from application types
- Type transformations should be explicit and type-safe
- The `satisfies` operator should be used to validate type conformance
- Indexed access types should be used for fields that directly map to database columns
- Comments should indicate when fields are calculated/derived rather than direct database fields

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
- **Boundary Testing**: Apply Test Boundary Analysis for edge cases and limits

### Code Quality Standards

- **TypeScript Strict**: No any types, proper interfaces
- **Test Coverage**: Comprehensive testing with error detection and boundary analysis
- **Performance**: Sub-second response times for most operations
- **Documentation**: Clear, current documentation for all features

## Learnings & Project Insights

### Key Discoveries

1. **PlayerStats Relationships**: Critical importance of correct JOIN patterns
2. **Team Associations**: SeasonTeamPlayers is source of truth, not TeamRosters
3. **Mobile Performance**: Essential data only on small screens improves UX
4. **Filter Architecture**: parseQueryFilterParams middleware enables consistent filtering
5. **E2E Testing**: Must run from root for proper seeding and builds
6. **Types Package**: Requires explicit build after changes to propagate

### Technical Debt Awareness

- **Complex Database Queries**: Need careful optimization for performance
- **Mobile Table Design**: Ongoing refinement of what data is essential
- **Error Handling**: Consistent patterns across frontend and backend
- **Testing Strategy**: Balance between comprehensive coverage and development speed
- **Build Dependencies**: Types package changes need explicit build step

### Success Factors

- **Consistent Patterns**: Following established patterns reduces bugs
- **Documentation**: Good documentation enables faster development
- **Mobile-First**: Designing for mobile improves overall UX
- **Performance Focus**: Fast queries essential for good user experience
- **Boundary Testing**: Testing edge cases prevents production issues
- **Proper E2E Setup**: Correct test environment setup prevents flaky tests

### Critical Lessons from E2E Test Seed (January 2025)

**Step-by-Step Analysis Rule**:

- **ALWAYS understand existing working solutions before making changes**
- **Run existing tests first** to see what's actually working
- **Identify the actual problem** - don't assume what needs to be fixed
- **Make minimal changes** - avoid over-engineering solutions
- **Test incrementally** - verify each small change before proceeding

**E2E Test Seed Guidelines**:

- **Minimal seed data**: Only include what tests actually require
- **Focus on validation**: Most E2E tests validate UI behavior, not full flows
- **Test existing state first**: Always run tests with current seed before making changes
- **Avoid pre-seeding complex scenarios**: Let tests create their own data when possible

**Database Schema Migration Rules**:

- **Analyze test impact**: Understand which tests use which tables/columns
- **Preserve working patterns**: If tests work with current data structure, don't change unnecessarily
- **Incremental migration**: Update only what's actually broken, not everything related

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

## Current Focus: Frontend Testing Setup (Unit + E2E)

### Recent Accomplishments

**Frontend Testing Implementation (January 2025)**

- ✅ **Added Jest + React Testing Library** to frontend for unit testing
- ✅ **Configured Jest** with Next.js integration, coverage reporting, and CI integration
- ✅ **Fixed TypeScript errors** by adding proper Jest DOM type declarations
- ✅ **Updated GitLab CI** to run frontend unit tests
- ✅ **Established testing hierarchy**: Unit (Jest) → E2E (Playwright)
- ✅ **Playwright E2E Testing**: Configured for testing multi-component functionality with real backend

**TDD Workflow Implementation (January 2025)**

- ✅ **Successfully implemented TDD workflow** for PlayerValuesFloatingWindow component
- ✅ **Created comprehensive test suite** with 17 test cases covering all component behaviors
- ✅ **Established TDD command preference**: Use `pnpm test:watch` instead of individual test runs
- ✅ **Demonstrated Red-Green-Refactor cycle** with proper test-first development
- ✅ **Achieved 100% test coverage** for PlayerValuesFloatingWindow component

**TDD Workflow with test:watch (January 2025)**

**Hybrid TDD Workflow - AI Assistant + User Collaboration:**

**AI Assistant Role (Fast TDD Feedback):**

- Use **targeted test runs** for immediate feedback during development
- Focus on specific files being worked on
- Get fast feedback in 5-10 seconds for Red-Green-Refactor cycles
- Example: `pnpm test src/__tests__/controllers/leaderboards.controllers.test.ts`

**User Role (System-Wide Monitoring):**

- Run **`pnpm test:watch`** locally during development sessions
- Press **`a`** to run all tests whenever needed to check system health
- **Stop AI immediately** if any tests break or regressions are detected
- Monitor for cross-cutting issues that targeted tests might miss

**Benefits of Hybrid Approach:**

- ✅ **Speed**: AI gets fast feedback for TDD cycles (5-10s vs 39s)
- ✅ **Safety**: User catches regressions immediately across entire codebase
- ✅ **Efficiency**: Best of both worlds - fast development + comprehensive monitoring
- ✅ **Collaboration**: Clear roles and responsibilities

**TDD Cycle with Hybrid Workflow:**

1. **Red Phase**: AI writes test first → User watches for failures
2. **Green Phase**: AI writes minimal implementation → User confirms no regressions
3. **Refactor Phase**: AI improves code → User ensures system stability

**Preferred TDD Command:**

```bash
# AI Assistant - Fast targeted feedback
pnpm test src/__tests__/specific-feature.test.ts  # 5-10s

# User - Continuous monitoring
pnpm test:watch  # Running locally
# Press 'a' whenever you want to check full system health
```

**Testing Troubleshooting Priority:**

1. **First**: Add ResizeObserver polyfill for any AggregateError with Radix UI components
2. **Second**: Only consider React downgrade if ResizeObserver polyfill doesn't work
3. **Always**: Bump back to React 19 once issues are resolved

**Debug Logging Cleanup Pattern:**

- **During Development**: Use console.log/console.error for debugging test failures
- **Before Committing**: Remove all debugging logs once tests are passing
- **Production Code**: Never commit debug logging (except structured logging for errors)
- **Test Files**: Keep clean and production-ready, no debugging artifacts

**Example Cleanup Checklist:**

- [ ] Remove console.log statements
- [ ] Remove console.error spy calls
- [ ] Remove temporary debugging assertions
- [ ] Ensure all mocks are properly typed
- [ ] Verify tests still pass after cleanup

This pattern resolves the common AggregateError issues that occur when testing components using Radix UI (Checkbox, Select, etc.) in React 19 + Jest + jsdom environments.

**E2E Testing Configuration Fix (January 2025)**

**Problem Identified:**

- Running `pnpm test:e2e <specific_test_file>` was not working correctly
- The command was running all e2e tests instead of just the specified file
- This was due to hardcoded directory paths and argument parsing issues in package.json scripts

**Root Cause:**

```json
// OLD (problematic) configuration
"test:e2e": "PW_TEST_HTML_REPORT_OPEN='never' TEST_TYPE=e2e playwright test src/__tests__/e2e/ --"
```

The issues were:

1. **Hardcoded directory path**: `src/__tests__/e2e/` was hardcoded, causing conflicts when passing specific files
2. **Trailing `--`**: This caused argument parsing issues with Playwright
3. **Incorrect testDir configuration**: Playwright config was pointing to wrong directory

**Solution Implemented:**

1. **Updated package.json scripts:**

```json
// NEW (working) configuration
"test:e2e": "PW_TEST_HTML_REPORT_OPEN='never' TEST_TYPE=e2e playwright test"
```

2. **Updated playwright.config.ts:**

```typescript
// Changed from
testDir: "./src/__tests__";
// To
testDir: "./src/__tests__/e2e";
```

**Result:**

- ✅ Can now run specific e2e test files: `pnpm test:e2e kanahautomo.test.ts`
- ✅ Can run tests by title: `pnpm test:e2e -g "happy path: authenticated user can register for Kanahautomo"`
- ✅ Can run tests in UI mode: `pnpm test:e2e:ui kanahautomo.test.ts`
- ✅ Can run tests in headed mode: `pnpm test:e2e:headed kanahautomo.test.ts`
- ✅ Maintains backward compatibility for running all e2e tests: `pnpm test:e2e`

**IMPORTANT E2E Testing Workflow:**

**Root Level (RECOMMENDED):**

```bash
# From monorepo root - handles everything automatically
pnpm test:e2e                    # All e2e tests
pnpm test:e2e kanahautomo.test.ts # Specific test file
```

**What root `pnpm test:e2e` does automatically:**

1. **Database Setup**: `pnpm --filter=backend reseed:e2e` (resets and seeds database)
2. **Build**: `pnpm build` (builds the entire project)
3. **E2E Tests**: `pnpm --filter=frontend test:e2e` (executes Playwright tests)

**Frontend Level (For Debugging Only):**

```bash
# Only use when you need manual control or debugging
cd apps/frontend && pnpm test:e2e kanahautomo.test.ts
cd apps/frontend && pnpm test:e2e:ui kanahautomo.test.ts
cd apps/frontend && pnpm test:e2e:headed kanahautomo.test.ts
```

**Verification:**

- Successfully tested with `pnpm test:e2e kanahautomo.test.ts` from root
- Confirmed only 3 Kanahautomo tests run instead of all e2e tests
- Updated memory bank documentation to reflect new capabilities

This fix enables targeted e2e testing for faster development feedback and better debugging capabilities.

### Current Testing Status

**Frontend Unit Testing (Jest + React Testing Library)**

- ✅ **Leaderboards Page**: Complete unit test with proper mocking
- ✅ **Profile Form**: Complete unit test with React 19 + Radix UI compatibility
- ✅ **Test Infrastructure**: Jest configuration, TypeScript integration, CI setup
- ✅ **Component Coverage**: Core components have comprehensive unit tests

**Frontend E2E Testing (Playwright)**

- ✅ **Playwright Configuration**: Properly configured for e2e testing
- ✅ **E2E Test Files**: Signup form and email verification tests
- ✅ **Test Infrastructure**: Standalone server setup for e2e testing
- ✅ **CI Integration**: E2E tests configured for GitLab CI

**Testing Patterns Established**

- **Unit Testing**: Use React Testing Library for user-centric component testing
- **E2E Testing**: Use Playwright for multi-component functionality with real backend
- **Mock Strategy**: Mock hooks, API calls, and external dependencies in unit tests
- **React 19 Compatibility**: ResizeObserver polyfill for Radix UI components
- **Type Safety**: Proper TypeScript integration with Jest DOM types

### Testing Strategy

**Unit Tests (Jest + React Testing Library)**

- **Purpose**: Simple rendering testing with mocked hooks
- **Scope**: Individual components in isolation
- **Mocking**: Mock all external dependencies (hooks, API calls)
- **Location**: `/src/__tests__/unit/`

**E2E Tests (Playwright)**

- **Purpose**: Larger functionality testing across multiple components
- **Scope**: Real backend requests and multi-component interactions
- **Backend**: Use real backend, no mocking of API calls
- **Location**: `/src/__tests__/e2e/`

### Next Steps

**Immediate Priorities**

1. **Expand Unit Test Coverage**
   - Add unit tests for remaining core components
   - Focus on user interaction patterns and form validation
   - Ensure all critical user flows have unit test coverage

2. **Expand E2E Test Coverage**
   - Add e2e tests for complex user workflows
   - Test multi-component interactions
   - Ensure critical user journeys are covered

3. **Test Quality Improvements**
   - Refine mocking strategies for complex components
   - Add more edge case testing
   - Improve test readability and maintainability

**Testing Strategy**

- **Primary Focus**: Unit tests for component behavior and user interactions
- **Secondary Focus**: E2E tests for complex workflows and backend integration
- **Test Organization**: `/src/__tests__/unit/` for Jest, `/src/__tests__/e2e/` for Playwright
- **TypeScript Integration**: Import `@testing-library/jest-dom` in type declaration file
- **CI Integration**: `test:frontend:unit` and `test:frontend:e2e` jobs for automated testing

### Key Learnings

**React 19 + Testing Compatibility**

- **Root Cause**: AggregateError in React 19 unit tests was due to missing ResizeObserver
- **Solution**: Add ResizeObserver polyfill for jsdom environment
- **Pattern**: Always try polyfill first, React downgrade only as last resort
- **Documentation**: Pattern now documented for future development

**Component Testing Best Practices**

- **User-Centric**: Test from user perspective, not implementation details
- **Mock Strategy**: Mock external dependencies, not internal component logic
- **Accessibility**: Use semantic queries (getByRole, getByLabelText) when possible
- **Error Handling**: Test error states and edge cases thoroughly

**E2E Testing Best Practices**

- **Real Backend**: Use actual backend for API calls, no mocking
- **Multi-Component**: Test interactions between multiple components
- **User Workflows**: Focus on complete user journeys
- **Standalone Server**: Use standalone build for consistent testing environment
- **Backend Startup**: Start backend with `pnpm --filter=backend dev:e2e` for successful API requests
- **Response Stubbing**: Stub responses from backend endpoints that do external fetches outside our system
- **Future MSW Integration**: Research MSW server running outside Playwright to snoop on requests
- **Monorepo Command**: Run `pnpm test:e2e` from root to handle reseed, seed, seed:e2e, and Playwright tests

### Technical Debt & Improvements

**Testing Infrastructure**

- ✅ **Jest Configuration**: Properly configured for Next.js and TypeScript
- ✅ **React Testing Library**: Set up with accessibility-focused testing
- ✅ **Playwright Configuration**: Properly configured for e2e testing
- ✅ **TypeScript Integration**: Jest DOM types properly configured
- ✅ **CI Integration**: Automated testing in GitLab CI pipeline

**Component Testing Gaps**

- ❌ **Complex Components**: Some multi-step components need more comprehensive testing
- ❌ **Error Boundary Testing**: Need better patterns for testing error states
- ❌ **Performance Testing**: No unit tests for performance-critical components

**E2E Testing Gaps**

- ❌ **Test Coverage**: Need more e2e tests for critical user workflows
- ❌ **Database Management**: Need proper database reset patterns for e2e tests
- ❌ **Test Isolation**: Need better isolation between e2e test runs

### Testing Architecture Decisions

**Unit Testing Strategy**

- **Component-Focused**: Test individual components in isolation
- **User Behavior**: Focus on user interactions and outcomes
- **Mock External Dependencies**: API calls, hooks, and external services
- **Accessibility**: Ensure components work with assistive technologies

**E2E Testing Strategy**

- **Workflow-Focused**: Test complete user journeys
- **Real Backend**: Use actual backend for API calls
- **Multi-Component**: Test interactions between components
- **Standalone Environment**: Use standalone build for consistent testing
- **Backend Requirements**: Start backend with `pnpm --filter=backend dev:e2e`
- **External API Stubbing**: Stub responses for endpoints that fetch external data

**Test Organization**

```
/src/__tests__/unit/         → Jest unit tests for components
/src/__tests__/e2e/          → Playwright e2e tests for workflows
```

**Testing Tools & Libraries**

- **Jest**: Test runner and assertion library for unit tests
- **React Testing Library**: User-centric component testing
- **Jest DOM**: Custom matchers for DOM testing
- **Playwright**: E2E testing framework for browser automation
- **MSW**: Mock Service Worker for API mocking (when needed)

### Success Metrics

**Testing Coverage Goals**

- **Component Coverage**: All core components have unit tests
- **User Flow Coverage**: Critical user interactions are tested
- **Error State Coverage**: Error handling and edge cases are tested
- **Accessibility Coverage**: Components work with assistive technologies
- **E2E Coverage**: Critical user workflows have e2e tests

**Quality Metrics**

- **Test Reliability**: Tests pass consistently without flakiness
- **Test Maintainability**: Tests are easy to understand and modify
- **Test Performance**: Tests run quickly and efficiently
- **Test Documentation**: Tests serve as living documentation

## Database Schema Overview

### Core Tables

#### User Management

- **Accounts**: Core user accounts with work email, full name, discord
- **LinkedAccounts**: Steam account linking to main accounts
- **SteamPlayers**: Steam player profiles with nicknames
- **UserPolicyAcceptances**: Privacy policy and marketing consent tracking

#### Authentication & Authorization

- **AccountRoles**: User roles per game (admin, moderator, etc.)
- **AccountPermissionScopes**: Granular permissions per season/team
- **Roles**: Available roles (admin, moderator, etc.)
- **Permissions**: Available permissions
- **RolePermissions**: Role-permission mappings

#### Organizations & Teams

- **Organizations**: Company/organization entities
- **Teams**: Teams within organizations
- **TeamRosters**: Current team rosters
- **SeasonTeamRegistrations**: Team registrations for seasons
- **SeasonTeamPlayers**: Player assignments to teams in seasons

#### Seasons & Leagues

- **Seasons**: Tournament seasons with dates and platforms
- **Leagues**: Different competition tiers
- **SeasonLeagues**: Season-league mappings with tiers
- **SeasonLeagueTeams**: Team placements in leagues per season

#### Player Management

- **SeasonPlayerRanks**: Player ranks and stats per season
- **SeasonPlayerApprovals**: Player approval workflow

#### Matches & Games

- **Matches**: Match scheduling and metadata
- **MatchTeams**: Team participation in matches
- **MatchGames**: Individual games within matches
- **MatchTeamMapVetoes**: Map veto process
- **TeamGameScores**: Team scores per game

#### Game Data

- **Games**: Supported games (CS2, etc.)
- **Maps**: Available maps
- **PlayerStats**: Detailed player performance statistics
- **PlayerTrades**: Trade kill tracking
- **MapRoundStats**: Round-by-round statistics
- **MatchGameClips**: Game clip management

#### System

- **AuditLog**: Comprehensive audit trail
- **Reservations**: Stream reservations

### Key Relationships

#### User Flow

```
Accounts ←→ LinkedAccounts ←→ SteamPlayers
Accounts ←→ UserPolicyAcceptances
Accounts ←→ AccountRoles ←→ Roles
```

#### Team Structure

```
Organizations ←→ Teams ←→ TeamRosters ←→ SteamPlayers
Teams ←→ SeasonTeamRegistrations ←→ Seasons
SeasonTeamRegistrations ←→ SeasonTeamPlayers ←→ SteamPlayers
```

#### Competition Structure

```
Seasons ←→ SeasonLeagues ←→ Leagues
SeasonLeagues ←→ SeasonLeagueTeams ←→ Teams
Seasons ←→ SeasonPlayerRanks ←→ SteamPlayers
```

#### Match Structure

```
Matches ←→ MatchTeams ←→ Teams
Matches ←→ MatchGames ←→ Maps
MatchGames ←→ PlayerStats ←→ SteamPlayers
MatchGames ←→ TeamGameScores ←→ Teams
```

### Important Constraints & Triggers

#### Data Integrity Triggers

- **SeasonPlayerApprovals**: Ensures either organization_id or team_id is provided
- **SeasonTeamPlayers**: Prevents duplicate primary player registrations
- **SeasonTeamRegistrations**: Prevents duplicate team registrations and external platform IDs
- **Accounts**: Auto-updates updated_at timestamp

#### Foreign Key Relationships

- Cascade deletes for most relationships
- SET NULL for optional relationships (captains, co-captains)
- Complex composite key relationships for season-team-league mappings

### Type Safety Implications

#### Indexed Access Types Required

When creating interfaces that reference database fields, use indexed access types:

```typescript
// ✅ Correct - using indexed access types
export interface PlayerRankData {
  steam_id: SteamPlayers["steam_id"];
  cs2_rank: SeasonPlayerRanks["cs2_rank"];
  faceit_elo: SeasonPlayerRanks["faceit_elo"];
  season_id: Seasons["id"];
}

// ❌ Incorrect - manual type duplication
export interface PlayerRankData {
  steam_id: bigint;
  cs2_rank: number | null;
  faceit_elo: number | null;
  season_id: number;
}
```

#### Raw vs Processed Data

Create separate interfaces for raw database results and processed application data:

```typescript
// Raw database result (string from SQL functions)
export interface PlayerStatsRaw {
  steam_id: SteamPlayers["steam_id"];
  average_rating: string | null; // SQL avg() returns string
}

// Processed application data
export interface PlayerStats {
  steam_id: SteamPlayers["steam_id"];
  average_rating: number | null; // Transformed to number
}
```

## Next Steps

- Ensure all new database-related interfaces use indexed access types
- Update existing interfaces to follow the pattern
- Maintain separation between raw and processed data types
- Follow TDD workflow for any database-related changes

## Important Patterns

- Use `satisfies` operator for type validation
- Create type guards for runtime validation
- Separate raw database types from processed application types
- Document calculated/virtual fields with comments
- Follow the established foreign key relationship patterns

## Learnings

- Database schema is comprehensive with proper normalization
- Complex many-to-many relationships through junction tables
- Extensive use of triggers for data integrity
- Clear separation between core entities and seasonal data
- Audit logging for compliance and debugging

## Error Handling Patterns

### Controller Error Handling Rule

**Controllers should NOT use try/catch blocks** - let errors bubble up naturally to be handled by Express error handling middleware.

**Rationale:**

- Try/catch blocks in controllers can mask errors and make debugging harder
- Express error handling middleware provides centralized error handling
- Errors should bubble up to appropriate boundaries for proper handling
- This pattern improves code readability and maintainability

**Example - ❌ Wrong (Controller with try/catch):**

```typescript
export const registerForKanahautomo = async (req: Request, res: Response) => {
  try {
    const { organization_id } = req.body;
    if (!organization_id) {
      return res
        .status(400)
        .json({ error: "Valid organization_id is required" });
    }
    // ... rest of logic
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
```

**Example - ✅ Correct (Controller without try/catch):**

```typescript
export const registerForKanahautomo = async (req: Request, res: Response) => {
  const { organization_id } = req.body;
  if (!organization_id) {
    throw new BadRequestError("Valid organization_id is required");
  }
  // ... rest of logic - errors bubble up naturally
};
```

### Model Transaction Pattern

**Models MAY use try/catch blocks when using database transactions** with `await connection.beginTransaction()`.

**Pattern from auth.models.ts:**

```typescript
export const createAccountForSteam = async (params: CreateUserParams) => {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    // ... database operations using connection
    await connection.commit();
    return result;
  } catch (error: unknown) {
    await connection.rollback();
    throw error; // Re-throw to bubble up
  } finally {
    connection.release();
  }
};
```

**Key Points:**

- Use try/catch only for transaction management
- Always rollback on error
- Always release connection in finally block
- Re-throw errors to bubble up to controller
- This pattern ensures proper resource cleanup

### Testing Error Cases

**When testing controllers that throw errors, use Jest's `await expect(...).rejects.toThrow()` pattern:**

```typescript
// ❌ Wrong - checking response status for thrown errors
it("should return 400 when organization_id is missing", async () => {
  // ... setup
  await controller(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
});

// ✅ Correct - expecting thrown errors
it("should throw error when organization_id is missing", async () => {
  // ... setup
  await expect(controller(req, res)).rejects.toThrow(
    "Valid organization_id is required"
  );
});
```

**Only check response status for successful cases:**

```typescript
// ✅ Correct - checking response for successful cases
it("should successfully register a player", async () => {
  // ... setup with valid data
  await controller(req, res);
  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith(expectedResponse);
});
```

### SQL Query Verification Testing

**For testing actual SQL queries and parameters, create separate test files that only mock `runQuery`:**

```typescript
// Only mock runQuery, not the models
jest.mock("../../db/mysqlRunQuery", () => ({
  runQuery: jest.fn()
}));

// Use real model implementations to verify actual SQL
it("should verify correct SQL queries and parameters", async () => {
  mockRunQuery.mockImplementation((query, params) => {
    // Return appropriate mock data based on query
  });

  await controller(req, res);

  // Verify actual SQL queries and parameters
  expect(mockRunQuery).toHaveBeenCalledWith(
    "SELECT * FROM Organizations WHERE id = ?",
    [1]
  );
});
```

**Benefits:**

- Tests verify actual SQL being generated by models
- Ensures queries are optimized and correct
- Catches SQL injection vulnerabilities
- Validates parameter binding

# Frontend Custom Color Class Convention

- Always use `text-kanaliiga-orange` instead of `kanaliiga-orange`
- Always use `text-kanaliiga-light-brown` instead of `kanaliiga-light-brown`
- This follows Tailwind CSS conventions for text color utility classes
- Apply this rule to all frontend code and reviews

## Current Development Focus

### In Progress (June 2025)

- Performance optimizations for player statistics loading
- Improving mobile responsiveness of match statistics page
- API response caching for frequently accessed endpoints
- Expanding test coverage for frontend components

### Short-Term Priorities

- Trade information display from PlayerTrade table
- Parser integration with new statistics features
- Historical data visualization for players and teams
- Head-to-head comparison tools
- Enhanced skill rating system implementation (KanaRating 2.0)

### Medium-Term Priorities

- FaceIT webhooks for automatic data retrieval
- Match calendar and upcoming match information
- Kanahautomo player interest system completion
- Team management features for captains
- Customizable data grid with selectable columns
- Advanced skill rating features (predictive modeling, role-based comparison)

### Enhanced Skill Rating System Development

**Priority Features from KanaRating 2.0:**

- Round phase classification (pistol/eco/force-buy/full-buy performance)
- Advanced trade mechanics with positioning and timing analysis
- Situational performance metrics (under pressure, time constraints)
- Enhanced positioning analysis with survival intelligence
- Weapon-specific impact and efficiency tracking
- Role-based consistency evaluation (entry fragger, support, anchor, lurker, IGL)
- Dynamic normalization using percentile-based ranges
- Utility intelligence with team coordination tracking
- Advanced aim analysis with situational context

### Recent Challenges
