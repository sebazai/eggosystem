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
