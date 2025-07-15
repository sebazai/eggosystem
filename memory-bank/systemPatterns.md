# System Patterns - Kanaliiga Eggosystem

## Architecture Overview

The Kanaliiga Eggosystem follows a monorepo structure using PNPM workspaces with clear separation between frontend and backend concerns.

## Testing Architecture

### Test Strategy Hierarchy

**Unit Tests (Jest + React Testing Library)**

- **Purpose**: Test individual components and functions in isolation
- **Speed**: Very fast (< 5 seconds)
- **Scope**: Single component or utility function
- **Command**: `pnpm test` (fast feedback during development)
- **Watch Mode**: `pnpm test:watch` (TDD workflow)

**E2E Tests (Playwright)**

- **Purpose**: Test complete user workflows with real backend
- **Speed**: Slower (requires database setup)
- **Scope**: Multi-component interactions, full user journeys
- **Command**: `cd $(git rev-parse --show-toplevel) && pnpm test:e2e` (**ALWAYS from root**)
- **Database**: Full reseed, seed, seed:e2e setup

**Testing Strategy Rules:**

1. **E2E Command Requirements**:
   - **MUST run from monorepo root**: Ensures proper database seeding and builds
   - **Does NOT start dev:e2e backend**: That's handled separately
   - **Includes build step**: Ensures latest code is tested

2. **Boundary Value Testing Strategy**:
   - **Minimum Valid Values**: Test smallest acceptable inputs (e.g., 2-char names)
   - **Maximum Valid Values**: Test largest acceptable inputs (e.g., max length strings)
   - **Below Minimum**: Test values just under the limit (should fail validation)
   - **Above Maximum**: Test values just over the limit (should fail validation)
   - **Edge Cases**: Empty strings, null values, special characters
   - **Boundary Transitions**: Test exactly at the limits

3. **Package/Types Build Requirement**:
   - **After any changes in packages/types**: `cd $(git rev-parse --show-toplevel) && pnpm --filter=@eggosystem/types build`
   - **Why**: Changes don't auto-propagate to backend/frontend

### TDD Workflow Patterns

**Red-Green-Refactor Cycle:**

1. **Red**: Write failing test first
2. **Green**: Write minimal code to make test pass
3. **Refactor**: Improve code while keeping tests green

**Command Preferences:**

- **Development**: `pnpm test:watch` for continuous feedback
- **Specific Files**: `pnpm test path/to/specific.test.ts` for targeted testing
- **Full Suite**: `pnpm test:all` for comprehensive validation

### Error Testing Patterns

**Use `await expect().rejects.toThrow()` for testing expected failures:**

```typescript
// ✅ Good - Jest async error testing
it("should fail with invalid data", async () => {
  await expect(serviceFunction(invalidData)).rejects.toThrow(
    /validation error/i
  );
});

// ❌ Bad - manual try/catch in tests
it("should fail with invalid data", async () => {
  try {
    await serviceFunction(invalidData);
    throw new Error("Should have failed");
  } catch (error) {
    expect(error.message).toContain("validation");
  }
});
```

## Database Query Patterns

### Critical JOIN Patterns

The most important pattern in the system - PlayerStats relationships:

```sql
-- Correct pattern for PlayerStats
SELECT * FROM PlayerStats ps
INNER JOIN MatchGames mg ON ps.game_id = mg.id
INNER JOIN Matches m ON mg.match_id = m.id

-- Team filtering pattern
const teamJoinType = team_ids && team_ids.length ? "INNER" : "LEFT";
-- Use SeasonTeamPlayers for team relationships

-- League filtering - IMPORTANT
-- Always use l.id instead of m.league_id in WHERE clauses
```

### Dynamic JOIN Strategy

```typescript
// Pattern for conditional JOINs based on filters
const teamJoinType = team_ids && team_ids.length ? "INNER" : "LEFT";
query = query.join(
  "SeasonTeamPlayers as stp",
  teamJoinType,
  "stp.player_id",
  "sp.id"
);

// Prevents data exclusion when filters aren't applied
```

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

## Type Management Patterns

### Indexed Access Types

When creating interfaces that reference database fields, use indexed access types:

```typescript
// ✅ Correct - using indexed access types
export interface PlayerRankData {
  steam_id: SteamPlayers["steam_id"];
  cs2_rank: SeasonPlayerRanks["cs2_rank"];
  faceit_elo: SeasonPlayerRanks["faceit_elo"];
}

// ❌ Incorrect - manual type duplication
export interface PlayerRankData {
  steam_id: bigint;
  cs2_rank: number | null;
  faceit_elo: number | null;
}
```

### Raw vs Processed Data

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

### Type Safety Best Practices

- Use `satisfies` operator for type validation
- Create type guards for runtime validation
- Separate raw database types from processed application types
- Document calculated/virtual fields with comments

## Error Handling Patterns

### Controller Error Handling

**Controllers should NOT use try/catch blocks** - let errors bubble up naturally to be handled by Express error handling middleware.

```typescript
// ✅ Correct (Controller without try/catch)
export const registerForKanahautomo = async (req: Request, res: Response) => {
  const { organization_id } = req.body;
  if (!organization_id) {
    throw new BadRequestError("Valid organization_id is required");
  }
  // ... rest of logic - errors bubble up naturally
};
```

### Model Transaction Pattern

**Models MAY use try/catch blocks when using database transactions**:

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

## Frontend Patterns

### Data Fetching with SWR

```typescript
// Using SWR for data fetching with proper types
const { data, error, isLoading } = useSWR<PlayerStats[]>(
  `/api/players?season_id=${seasonId}`,
  expressFetcher
);
```

### Mobile-First Design

- Use `text-xs` for tables on mobile
- Use `hidden md:table-cell` pattern for responsive tables
- Show essential data only on mobile screens
- Use Tailwind breakpoints consistently

### Custom Color Classes

- Always use `text-kanaliiga-orange` instead of `kanaliiga-orange`
- Always use `text-kanaliiga-light-brown` instead of `kanaliiga-light-brown`
- This follows Tailwind CSS conventions for text color utility classes
