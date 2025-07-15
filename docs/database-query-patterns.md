# Database Query Patterns

## Critical JOIN Patterns

The most important pattern in the system is the PlayerStats relationships:

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

## Dynamic JOIN Strategy

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

## Query Debugging Pattern

All database queries should include logging for debugging:

```typescript
console.log("Query:", query.toString());
console.log("Parameters:", params);
```

## SQL Aggregation Patterns for Team Value Calculations

The team value sorter feature demonstrates effective patterns for complex SQL aggregation:

```typescript
// Using WITH clause for complex multi-step calculations
export async function getTeamValuesForSorter(
  season_id: number
): Promise<TeamValueSorterResults[]> {
  const query = `
    WITH player_values AS (
      SELECT 
        pt.team_id,
        pk.player_id,
        pk.kanaelo_value,
        ROW_NUMBER() OVER (PARTITION BY pt.team_id ORDER BY pk.kanaelo_value DESC) as value_rank
      FROM season_team_players pt
      JOIN player_kanaelo pk ON pk.player_id = pt.player_id
      WHERE pt.season_id = $1 AND pk.season_id = $1
    ),
    team_stats AS (
      SELECT 
        t.id as team_id,
        t.name as team_name,
        COALESCE(sl.name, 'Unknown') as league_name,
        COALESCE(
          (SELECT SUM(pv.kanaelo_value) 
           FROM player_values pv 
           WHERE pv.team_id = t.id AND pv.value_rank <= 5),
          0
        ) as top5_sum,
        COALESCE(
          (SELECT ROUND(AVG(pv.kanaelo_value), 3)
           FROM player_values pv 
           WHERE pv.team_id = t.id AND pv.value_rank <= 4),
          0
        ) as avg4
      FROM teams t
      LEFT JOIN season_teams st ON t.id = st.team_id AND st.season_id = $1
      LEFT JOIN season_leagues sl ON st.league_id = sl.id AND sl.season_id = $1
      WHERE EXISTS (SELECT 1 FROM season_team_players stp WHERE stp.team_id = t.id AND stp.season_id = $1)
    )
    SELECT 
      ts.*,
      json_agg(
        json_build_object(
          'player_id', pv.player_id,
          'kanaelo_value', pv.kanaelo_value,
          'value_rank', pv.value_rank
        ) ORDER BY pv.value_rank
      ) FILTER (WHERE pv.value_rank <= 5) as top_players
    FROM team_stats ts
    LEFT JOIN player_values pv ON ts.team_id = pv.team_id
    GROUP BY ts.team_id, ts.team_name, ts.league_name, ts.top5_sum, ts.avg4
    ORDER BY ts.top5_sum DESC;
  `;

  const result = await db.query<TeamValueSorterResults>(query, [season_id]);
  return result.rows;
}
```

Key patterns demonstrated:

1. **WITH Clause for Temporary Result Sets**:
   - Creates intermediate result sets (`player_values`, `team_stats`) for step-by-step calculations
   - Improves query readability and maintainability
   - Allows for complex calculations to be broken down into logical components

2. **Window Functions for Ranking**:
   - `ROW_NUMBER() OVER (PARTITION BY team_id ORDER BY kanaelo_value DESC)`
   - Efficiently ranks players within each team without multiple queries

3. **JSON Aggregation for Structured Data**:
   - `json_agg(json_build_object(...))` builds structured arrays for nested data
   - Returns player details as a structured JSON array
   - Filters aggregation with `FILTER (WHERE value_rank <= 5)` to limit to top players

4. **COALESCE for Null Handling**:
   - Provides default values when data is missing (e.g., league name, sums, averages)
   - Ensures consistent response structure regardless of data completeness

5. **Subqueries for Aggregation**:
   - Uses subqueries for specific calculations (`SUM`, `AVG`) within specific player rankings
   - Ensures calculations only include the top N players based on ranking

6. **Conditional Filtering with EXISTS**:
   - Uses `EXISTS` subquery to filter teams that have players in the specified season
   - More efficient than JOIN for existence checking

## Leaderboard Per-Round Statistics Calculation

For statistics that are expressed as "per round" (like kills per round, utility damage per round), we use a subquery to calculate the total rounds played in each game:

```sql
INNER JOIN (
  SELECT game_id, SUM(score + overtime_score) AS total_rounds
  FROM TeamGameScores
  GROUP BY game_id
) AS game_rounds ON game_rounds.game_id = mg.id
```

Key points about this pattern:

1. **Total Rounds Calculation**: The total rounds in a game is the sum of regular score and overtime score from both teams
2. **No Division by 2**: We do NOT divide by 2 because we want the actual total number of rounds played
3. **Per-Round Expressions**: Used in expressions like `sum(ps.kills) / sum(total_rounds)`
4. **INNER JOIN**: We use INNER JOIN to ensure we only include games with valid round data

This pattern ensures accurate per-round statistics that reflect the true rate at which events occur during gameplay.

## Team Relationship Handling

### Critical Pattern for Team Filtering

```sql
-- CORRECT: Use SeasonTeamPlayers for team relationships
SELECT ps.*, sp.steam_name
FROM PlayerStats ps
INNER JOIN SteamPlayers sp ON ps.player_id = sp.id
INNER JOIN SeasonTeamPlayers stp ON stp.player_id = sp.id
WHERE stp.team_id IN (?)

-- AVOID: Direct team_id matches between MatchTeams and SeasonTeamPlayers
-- This can filter out valid stats due to team changes
```

## Parameter Query Generation

### Filter Parameter Handling

```typescript
// Use utility for consistent parameter building
import { generateFiltersParamQuery } from "@/lib/utils";

const queryString = generateFiltersParamQuery({
  season_ids: seasons,
  league_ids: leagues,
  team_ids: teams,
  stages: stages,
  map_ids: maps
});
```

## Query Testing

### Filter Parameter Testing

```typescript
// Test all filtering scenarios including edge cases
describe("Filter Parameter Testing", () => {
  describe("empty arrays", () => {
    test("should handle empty season_ids", () => {
      const params = { season_ids: [] };
      // Test behavior with empty arrays
    });
  });

  describe("null values", () => {
    test("should handle null team_ids", () => {
      const params = { team_ids: null };
      // Test null handling
    });
  });

  describe("invalid IDs", () => {
    test("should handle non-numeric IDs", () => {
      const params = { season_ids: ["invalid"] };
      // Test validation
    });
  });

  describe("multiple filters combined", () => {
    test("should handle complex filter combinations", () => {
      const params = {
        season_ids: [1, 2],
        league_ids: [3],
        team_ids: [4, 5],
        map_ids: [6]
      };
      // Test complex combinations
    });
  });
});
```

### JOIN Testing

```typescript
// Verify correct JOIN types and table references
describe("Database JOIN Testing", () => {
  test("should use correct PlayerStats JOIN pattern", () => {
    const query = buildPlayerStatsQuery({ team_ids: [1] });

    expect(query.toString()).toContain(
      "INNER JOIN MatchGames mg ON ps.game_id = mg.id"
    );
    expect(query.toString()).toContain(
      "INNER JOIN Matches m ON mg.match_id = m.id"
    );
  });

  test("should use dynamic JOIN types for team filtering", () => {
    const queryWithTeam = buildPlayerStatsQuery({ team_ids: [1] });
    const queryWithoutTeam = buildPlayerStatsQuery({ team_ids: null });

    expect(queryWithTeam.toString()).toContain("INNER JOIN SeasonTeamPlayers");
    expect(queryWithoutTeam.toString()).toContain(
      "LEFT JOIN SeasonTeamPlayers"
    );
  });
});
```

### ParsedParams Testing

```typescript
// Ensure middleware correctly parses query parameters
describe("ParsedParams Middleware Testing", () => {
  test("should parse comma-separated IDs", () => {
    const req = { query: { season_ids: "1,2,3" } };
    parseQueryFilterParams(req, {}, () => {});

    expect(req.parsedParams.season_ids).toEqual([1, 2, 3]);
  });

  test("should handle single ID values", () => {
    const req = { query: { league_ids: "5" } };
    parseQueryFilterParams(req, {}, () => {});

    expect(req.parsedParams.league_ids).toEqual([5]);
  });

  test("should set null for missing parameters", () => {
    const req = { query: {} };
    parseQueryFilterParams(req, {}, () => {});

    expect(req.parsedParams.team_ids).toBeNull();
  });
});
```

## Performance Optimization

### Query Performance

- Use INNER JOINs for active filters (reduces result set)
- Use LEFT JOINs for optional data (preserves all results)
- Always include proper indexes on foreign keys
- Log query execution times in development

### Performance Testing

```typescript
// Test database queries perform efficiently with larger datasets
describe("Query Performance", () => {
  test("should execute player stats query within time limit", async () => {
    const startTime = Date.now();
    await getPlayerStats({ season_ids: [1, 2] });
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(1000); // < 1 second
  });

  test("should handle large result sets efficiently", async () => {
    // Insert large dataset
    await insertLargeTestDataset();

    const startTime = Date.now();
    const results = await getPlayerStats({});
    const endTime = Date.now();

    expect(results.length).toBeGreaterThan(1000);
    expect(endTime - startTime).toBeLessThan(2000); // < 2 seconds
  });
});
```
