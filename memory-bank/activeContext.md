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

## Current Focus: Frontend Testing Setup (Unit + E2E)

### Recent Accomplishments

**Frontend Testing Implementation (January 2025)**

- ✅ **Added Jest + React Testing Library** to frontend for unit testing
- ✅ **Configured Jest** with Next.js integration, coverage reporting, and CI integration
- ✅ **Fixed TypeScript errors** by adding proper Jest DOM type declarations
- ✅ **Updated GitLab CI** to run frontend unit tests
- ✅ **Established testing hierarchy**: Unit (Jest) → E2E (Playwright)
- ✅ **Playwright E2E Testing**: Configured for testing multi-component functionality with real backend

**React 19 + Radix UI Testing Pattern Discovery (January 2025)**

- ✅ **Identified root cause** of AggregateError in React 19 unit tests: Missing `ResizeObserver` polyfill for jsdom
- ✅ **Discovered solution**: Add ResizeObserver mock at the top of test files when using Radix UI components
- ✅ **Established testing pattern**: Always try ResizeObserver polyfill first before considering React downgrade
- ✅ **Confirmed compatibility**: React 19 works perfectly with proper ResizeObserver polyfill

**Key Testing Pattern for React 19 + Radix UI:**

```typescript
// Add this at the top of test files using Radix UI components
beforeAll(() => {
  global.ResizeObserver =
    global.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
});
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
