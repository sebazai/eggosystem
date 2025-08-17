# Active Context - Kanaliiga Eggosystem

## Current Work Focus

### Recent Implementation (January 2025)

- **Historical Data Visualization**: Implemented new player historical data tab with interactive charts
- **Chart Integration**: Successfully integrated recharts library following project patterns
- **Mobile-First Design**: Ensured all charts are responsive and follow project styling conventions

### Active Priorities

1. **Historical Data Feature**: ✅ COMPLETED - Frontend implementation with dummy data
2. **Memory Bank Implementation**: Complete migration from rule-based context to memory-bank structure
3. **Rule Cleanup**: Simplify cursor rules to contain only behavioral guidance
4. **Context Organization**: Establish clear hierarchy and relationships between memory bank files

## Recent Changes

### Completed (Today)

- ✅ Created new `/players/[steamId]/historical` route page
- ✅ Implemented PlayerHistoricalTab component with dummy chart data
- ✅ Added "Historical Data" tab to player navigation
- ✅ Created interactive charts using recharts:
  - Performance Over Time (Area Chart)
  - Match Statistics Trends (K/D Ratio and ADR Line Charts)
  - Skill Progression (Multi-line Chart for Aim, Positioning, Impact, Utility)
  - Map Performance History (Horizontal Area Chart)
- ✅ Ensured mobile-responsive design following project patterns
- ✅ Used project's chart configuration and styling conventions

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

- Historical Data Backend API endpoints (to replace dummy data)
- T/CT side toggle for player statistics in match view
  - Will allow filtering player stats by T-side or CT-side
  - Buttons will be positioned next to the "PLAYER" column header
  - Each team will have independent toggle state

## Next Steps

### Immediate (Next Session)

1. **Historical Data Backend Implementation**
   - Create API endpoints for historical player data
   - Implement database queries for time-series data
   - Connect frontend charts to real data

2. **Chart Enhancements**
   - Add date range filtering for historical data
   - Implement chart interactions (zoom, selection)
   - Add export functionality for chart data

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

### Historical Data Visualization Implementation

- **Chart Library**: Used recharts following existing project patterns
- **Data Structure**: Implemented dummy data with realistic time-series patterns
- **Mobile Design**: Charts are responsive using ChartContainer component
- **Styling**: Follows project color scheme with kanaliiga-orange accents
- **Chart Types**:
  - Area charts for performance trends
  - Line charts for statistics over time
  - Horizontal area chart for map performance comparison

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
7. **Chart Integration**: ChartContainer component provides consistent styling and responsive behavior
8. **Historical Data Structure**: Time-series data should be structured with date keys and multiple metrics
