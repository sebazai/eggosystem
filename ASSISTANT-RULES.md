# Assistant Rules

This document defines rules and preferences for the AI assistant when interacting with users on the Kanaliiga Eggosystem project.

## 1. Response Format

- **Conciseness**: Provide direct answers without unnecessary introductions or conclusions.
- **Code Blocks**: When providing code, use properly formatted code blocks with language syntax highlighting.
- **Explanations**: Only provide explanations when explicitly requested or when necessary for clarity.

## 2. Technical Conventions

- **Match Existing Style**: Follow the code style and conventions already established in the codebase.
- **Technology Stack**: Be aware the project uses Node.js, TypeScript, and PNPM and is also monorepo where we have apps/backend and apps/frontend without explicitly stating this in every response.
- **Documentation Format**: Follow the existing markdown format used in the docs directory.

## 3. Project-Specific Rules

- **Database Handling**: When discussing database operations, reference the schema defined in docs/database.md. Full schema can be found in apps/backend/migrations/20250127080330_database_schema.ts
- **Database Relationships**: Pay special attention to many-to-many relationships that use join tables (e.g., SeasonLeagues connects Seasons and Leagues). When writing queries, always ensure you join to the appropriate tables and reference columns from the correct tables (e.g., use `sl.season_id` not `l.season_id` when joining Leagues with SeasonLeagues).
- **PlayerStats Table Structure**: Note that the PlayerStats table links to MatchGames via `game_id` column, not directly to Matches. Always join PlayerStats to MatchGames first (ps.game_id = mg.id), then to Matches (mg.match_id = m.id) when creating queries that need match information.
- **Player-Team Relationships**: SteamPlayers do not have a direct `team_id` column. The relationship between players and teams is managed through the SeasonTeamPlayers table, not TeamRosters (which may be empty). Players may have played for different teams in the same season, and the team recorded in MatchTeams might not always match the team in SeasonTeamPlayers. When filtering player statistics by team, avoid using conditions that require an exact match between MatchTeams.team_id and SeasonTeamPlayers.team_id, as this can filter out valid stats.
- **Development Environment**: Assume work is being done in the devcontainer environment as described in README.md.
- **Navigation**: Use <AutoBreadcrumbs /> in components/layout for page navigation instead of back buttons to maintain consistent navigation patterns across the application.
- **Filtering Pattern**: Use the MultiFilters component for implementing filtering functionality. The component accepts five filter types (seasons, leagues, stages, teams, maps) that can be enabled or disabled by passing arrays of IDs or null. Always include the useFilters hook for managing filter states. When adding filters to a page, implement the pattern seen in the topteams/matches pages where filter state is kept in URL parameters.
- **Mobile View for Player Statistics**: For player statistics tables on mobile devices, show only the most essential columns: Player, K (kills), D (deaths), ADR, and Rating. Additional information like date, map, league, assists, HS%, and other detailed statistics should be hidden on mobile and only shown on medium-sized screens and larger. Use the "hidden md:table-cell" Tailwind class for columns that should be hidden on mobile.
- **Table Styling and Structure**: For all data tables in the application, use compact styling with the following guidelines:
  - Use `text-xs` for table cell content to ensure compact display
  - Apply `px-3 py-2` padding to table cells for consistent spacing
  - For secondary information like team names in player tables, use even smaller font sizes like `text-[0.65rem]`
  - When displaying player names with their team, show the team name in smaller text beneath the player name on mobile
  - For tables that need to display many columns, use a dedicated team column that's hidden on mobile (`hidden md:table-cell`)
  - Ensure consistent application of these spacing and font size patterns across similar components (player-table, player-details, match-stats, etc.)
  - Maintain clear hierarchy with proper use of font weight (bold for important stats) and text color contrasts

## 4. Frontend-Backend Integration

- **Data Fetching Pattern**: Use SWR for data fetching with the **nextFetcher** utility from @/lib/utils, not expressFetcher.
- **API Structure**: Create frontend API routes in apps/frontend/src/app/api/v1/... that proxy requests to the backend API endpoints.
- **Parameter Handling**: Use the generateFiltersParamQuery utility for building query parameters from FilterParamsQuery objects.
- **Error Handling**: Always implement proper error handling in both frontend hooks and API routes.
- **Data Hooks**: Follow the pattern in existing hooks (e.g., useTopTeams, usePlayers) that return the data, loading state, error state, and validation state.
- **Request Forwarding**: When forwarding requests from frontend to backend, preserve all query parameters.
- **Active Season Handling**: When implementing pages with filtering, always apply the active season as a default filter when no specific season is selected. Use the pattern: `seasons: activeSeason && seasons.length === 0 ? [activeSeason] : seasons` without additional conditions that might prevent the active season from being applied.
- **Hook Return Types**: Ensure hook return types match their implementations. Use `isError` (not `error`) in hook return objects for consistency, as demonstrated in the players and leaderboards hooks.

## 5. API Middleware and Filtering

- **Query Parameter Parsing**: All API endpoints that handle filtering (like /players/stats, /leaderboards, etc.) must use the `parseQueryFilterParams` middleware which processes query parameters and makes them available as `req.parsedParams`.
- **Middleware Requirement**: When creating or modifying route endpoints that require filtering functionality, always include the `parseQueryFilterParams` middleware in the route definition.
- **Controller Pattern**: In controllers, always access filter parameters through `req.parsedParams` rather than directly parsing `req.query`.
- **Model Functions**: Model functions should expect parameters in the `ParsedParams` interface format including:
  - `season_ids`: Array of season IDs
  - `league_ids`: Array of league IDs
  - `team_ids`: Array of team IDs
  - `stages`: Array of stage IDs
  - `map_ids`: Array of map IDs
- **Filtering by Team**: When filtering by team, use the `SeasonTeamPlayers` table for the relationship, not other tables. Use INNER JOIN instead of LEFT JOIN when applying team-specific filters.
- **Query Pattern**: Follow the established pattern in player.models.ts for applying filters to database queries. Always include proper JOIN conditions and column references.
- **Dynamic JOIN Types**: Use dynamic JOIN types based on filter presence. For team filtering, use: `const teamJoinType = team_ids && team_ids.length ? "INNER" : "LEFT";` to prevent data exclusion when filters aren't applied.
- **Leagues Table References**: When filtering by league_ids, always join to the Leagues table explicitly and use `l.id` instead of `m.league_id` in WHERE clauses.
- **Query Debugging**: Include query and parameter logging for easier debugging of SQL queries, especially for filtering operations.

## 6. Frontend Testing Best Practices

- **Data-Testid Attributes**: Always use `data-testid` attributes for elements that need to be selected in tests. Never rely on text content, labels, or generic selectors that could change.
- **Test Selector Stability**: For custom components like dropdowns, add `data-testid` attributes to all interactive parts (inputs, toggles, options).
- **Mocking API Responses**: When testing components that make API calls, always mock the backend responses with realistic data matching the expected API schema.
- **Form Testing**: When testing multi-step forms:
  - Mock all API endpoints the form will call during the process
  - Add specific test identifiers to form fields, buttons, and validation messages
  - Check for both enabled/disabled states of navigation buttons
  - Test form validation by attempting both valid and invalid inputs
- **Dropdown Testing**: When testing custom dropdown components like FancySelect:
  - Use `data-testid` attributes with the format `${filter}-dropdown-toggle`, `${filter}-add-new`, etc.
  - Test the open/close state of dropdowns and selection of options
  - Test "Add new" or "Other" options if available
- **Component Interaction**: When testing component interactions, favor data-testid selectors over getByRole or getByText for better stability.
