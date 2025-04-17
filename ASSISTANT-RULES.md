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
- **Navigation**: Use breadcrumbs (from shadcn/ui) for page navigation instead of back buttons to maintain consistent navigation patterns across the application.
- **Filtering Pattern**: Use the MultiFilters component for implementing filtering functionality. The component accepts five filter types (seasons, leagues, stages, teams, maps) that can be enabled or disabled by passing arrays of IDs or null. Always include the useActiveSeason hook and getParamArray utility for managing filter states. When adding filters to a page, implement the pattern seen in the topteams/matches pages where filter state is kept in URL parameters.

## 4. Frontend-Backend Integration

- **Data Fetching Pattern**: Use SWR for data fetching with the **nextFetcher** utility from @/lib/utils, not expressFetcher.
- **API Structure**: Create frontend API routes in apps/frontend/src/app/api/v1/... that proxy requests to the backend API endpoints.
- **Parameter Handling**: Use the generateFiltersParamQuery utility for building query parameters from FilterParamsQuery objects.
- **Error Handling**: Always implement proper error handling in both frontend hooks and API routes.
- **Data Hooks**: Follow the pattern in existing hooks (e.g., useTopTeams, usePlayers) that return the data, loading state, error state, and validation state.
- **Request Forwarding**: When forwarding requests from frontend to backend, preserve all query parameters.

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
- **Query Pattern**: Follow the established pattern in leaderboards.models.ts for applying filters to database queries.
