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

### Completed (Last 2 Weeks)

- ✅ Created memory-bank.mdc rule following polarsquad/ecoestate pattern
- ✅ Established memory-bank folder structure with core files
- ✅ Migrated project context from rules to memory bank documents
- ✅ Removed redundant nextFetcher.ts and updated to use expressFetcher/clientApiFetch pattern
- ✅ Fixed leaderboard rounds calculation by removing division by 2 in total_rounds SQL query
- ✅ Fixed type error in leaderboards test by using correct stage number format

### In Progress

- 🔄 Finalizing memory bank structure and content
- 🔄 Cleaning up existing rule files to remove duplicated context
- 🔄 Establishing progress tracking and active context documentation
- 🔄 Performance optimizations for player statistics loading
- 🔄 Improving mobile responsiveness of match statistics page
- 🔄 API response caching for frequently accessed endpoints

### Planned Features

- T/CT side toggle for player statistics in match view
  - Will allow filtering player stats by T-side or CT-side
  - Buttons will be positioned next to the "PLAYER" column header
  - Each team will have independent toggle state

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

## Key Technical Insights

1. **PlayerStats Relationships**: Critical importance of correct JOIN patterns
2. **Team Associations**: SeasonTeamPlayers is source of truth, not TeamRosters
3. **Mobile Performance**: Essential data only on small screens improves UX
4. **Filter Architecture**: parseQueryFilterParams middleware enables consistent filtering
5. **E2E Testing**: Must run from root for proper seeding and builds
6. **Types Package**: Requires explicit build after changes to propagate
