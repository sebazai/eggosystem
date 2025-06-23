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
   - **When**: Before running tests or starting dev servers after type changes

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

**Boundary Value Test Examples:**

```typescript
// Test minimum valid value
it("should accept minimum valid organization name", async () => {
  await expect(validateOrgName("AB")).resolves.toBe(true);
});

// Test below minimum (should fail)
it("should reject organization name below minimum", async () => {
  await expect(validateOrgName("A")).rejects.toThrow(/at least 2 characters/i);
});

// Test maximum valid value
it("should accept maximum valid organization name", async () => {
  const maxName = "A".repeat(100); // assuming 100 is max
  await expect(validateOrgName(maxName)).resolves.toBe(true);
});

// Test above maximum (should fail)
it("should reject organization name above maximum", async () => {
  const tooLongName = "A".repeat(101);
  await expect(validateOrgName(tooLongName)).rejects.toThrow(/too long/i);
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

### Query Debugging Pattern

All database queries should include logging for debugging:

```typescript
console.log("Query:", query.toString());
console.log("Parameters:", params);
```

### SQL Aggregation Patterns for Team Value Calculations

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

These patterns demonstrate efficient, readable SQL for complex aggregation calculations that would be difficult to express in multiple separate queries.

### Leaderboard Per-Round Statistics Calculation

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

## API Middleware Patterns

### Filter Parameter Processing

Every filtering endpoint MUST use this pattern:

```typescript
// Route definition
router.get("/endpoint", parseQueryFilterParams, controller);

// Controller access
const { season_ids, league_ids, team_ids, stages, map_ids } = req.parsedParams;
```

### Frontend API Proxy Pattern

```typescript
// Frontend API route structure
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryString = generateFiltersParamQuery(/* filters */);

  const response = await fetch(`${BACKEND_URL}/api${queryString}`);
  return Response.json(await response.json());
}
```

## Frontend Data Patterns

### SWR Data Fetching

```typescript
// Hook pattern
function useData(filters: FilterParams) {
  const { data, error, isLoading } = useSWR(["endpoint", filters], () =>
    expressFetcher("/api/v1/endpoint", filters)
  );

  return {
    data,
    isLoading,
    isError: !!error,
    isValidated: !isLoading && !error
  };
}

// Authenticated hook pattern
function useAuthData(filters: FilterParams) {
  const { data, error, isLoading } = useSWR(["auth-endpoint", filters], () =>
    clientApiFetch("/api/v1/auth-endpoint", filters)
  );

  return {
    data,
    isLoading,
    isError: !!error,
    isValidated: !isLoading && !error
  };
}
```

### Component Filter Integration

```typescript
// Active season default pattern
const effectiveFilters = {
  ...filters,
  seasons: activeSeason && seasons.length === 0 ? [activeSeason] : seasons
};
```

## UI Component Patterns

### Mobile-First Table Design

```tsx
// Essential columns only on mobile
<th className="px-3 py-2 text-xs">Player</th>
<th className="px-3 py-2 text-xs">K</th>
<th className="px-3 py-2 text-xs">D</th>
<th className="px-3 py-2 text-xs">ADR</th>
<th className="px-3 py-2 text-xs">Rating</th>
// Desktop-only columns
<th className="hidden md:table-cell px-3 py-2 text-xs">Assists</th>
```

### shadcn/ui Component Patterns

#### Component Usage Standards

**Import from UI directory**:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
```

**Button Variants**:

```tsx
// Primary actions
<Button>Save Changes</Button>
<Button variant="default">Default Action</Button>

// Secondary actions
<Button variant="outline">Cancel</Button>
<Button variant="secondary">Secondary</Button>

// Destructive actions
<Button variant="destructive">Delete</Button>

// Subtle actions
<Button variant="ghost">Ghost Button</Button>
<Button variant="link">Link Style</Button>

// Icon buttons
<Button size="icon" variant="outline">
  <Icon className="size-4" />
</Button>
```

**Card Layout Pattern**:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>{/* Main content */}</CardContent>
</Card>
```

**Form Component Integration**:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";

const formSchema = z.object({
  username: z.string().min(2).max(50)
});

function MyForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema)
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

**Select Component Pattern**:

```tsx
<Select onValueChange={(value) => setSelectedValue(value)}>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

**Badge Usage**:

```tsx
// Status indicators
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Draft</Badge>
```

#### Accessibility & Data Attributes

All shadcn/ui components include proper `data-slot` attributes for testing and styling:

```tsx
// Components automatically include data-slot attributes
<Button data-slot="button">Click me</Button>
<Card data-slot="card">Content</Card>
```

**Testing Pattern**:

```tsx
// Use data-slot attributes for testing selectors
await page.click('[data-slot="button"]');
await page.fill('[data-slot="input"]', "test value");
```

#### Styling Customization

**CSS Variable Theming**:

```css
/* All components use CSS variables for theming */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
}
```

**Tailwind Class Merging**:

```tsx
import { cn } from "@/lib/utils";

// Safely merge Tailwind classes
<Button className={cn("custom-class", additionalClasses)}>Button Text</Button>;
```

#### Component Composition

**Compound Components**:

```tsx
// Dialog composition
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>

// Dropdown menu composition
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
    <DropdownMenuItem>Item 2</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### Performance Considerations

**Client Components**:

- Most shadcn/ui components are client-side ("use client")
- Keep server components separate from shadcn/ui when possible
- Use dynamic imports for heavy components

**Bundle Size**:

- Import only needed components
- Tree-shaking automatically handles unused components
- Radix UI primitives are optimized for bundle size

### Navigation Pattern

```tsx
// Consistent navigation - NO back buttons
import { AutoBreadcrumbs } from "@/components/layout";

function PageComponent() {
  return (
    <>
      <AutoBreadcrumbs />
      {/* Page content */}
    </>
  );
}
```

### Filtering Component Pattern

```tsx
// Standard filtering integration
import { MultiFilters, useFilters } from "@/components/filters";

function PageWithFilters() {
  const {
    seasons,
    leagues,
    stages,
    teams,
    maps
    // ... other filter state
  } = useFilters();

  return (
    <MultiFilters
      seasons={seasons}
      leagues={leagues}
      // Enable only needed filters, pass null for disabled
      stages={null} // Disabled
      teams={teams}
      maps={maps}
    />
  );
}
```

## Error Handling Patterns

### Hook Return Structure

```typescript
// Consistent hook returns
return {
  data,
  isLoading,
  isError: !!error, // NOT 'error'
  isValidated: !isLoading && !error
};
```

### Frontend Error Detection (Testing)

```typescript
// Test setup for error detection
page.on("console", (msg) => {
  if (msg.type() === "error") {
    errors.push(`Console error: ${msg.text()}`);
  }
});

page.on("pageerror", (error) => {
  errors.push(`Page error: ${error.message}`);
});

page.on("requestfailed", (request) => {
  errors.push(`Request failed: ${request.url()}`);
});
```

## Link Handling Pattern

### Internal vs External Links

```tsx
// Internal navigation - ALWAYS use Link
import Link from 'next/link';
<Link href="/internal/path">Internal Page</Link>

// External links - use anchor tags
<a
  href="https://external.com"
  target="_blank"
  rel="noopener noreferrer"
>
  External Link
</a>
```

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

## Testing Patterns

### Test Structure & Organization

#### File Naming & Location

```typescript
// Test file naming pattern: *.test.ts
// Location: src/__tests__/ directories within respective domains
apps / backend / src / __tests__ / models / player.test.ts;
apps / backend / src / __tests__ / controllers / players.test.ts;
apps / frontend / src / components / __tests__ / player - table.test.tsx;
```

#### Test Organization

```typescript
// Group tests by feature/module with clear describe blocks
describe("Player Statistics", () => {
  describe("when filtering by team", () => {
    test("should return only players from specified teams", () => {
      /* ... */
    });
    test("should handle multiple team filters", () => {
      /* ... */
    });
  });

  describe("when filtering by season", () => {
    test("should apply active season by default", () => {
      /* ... */
    });
    test("should handle empty season arrays", () => {
      /* ... */
    });
  });
});
```

#### Test Database Configuration

```typescript
// Separate test database with proper cleanup
const testConfig = {
  ...baseConfig,
  connection: {
    ...baseConfig.connection,
    database: "kanaliiga_test"
  }
};
```

### Mock Patterns

#### Database Mocking

```typescript
// Mirror actual database structure in mocks
const mockPlayerStats = {
  id: 1,
  player_id: 123,
  game_id: 456,
  kills: 15,
  deaths: 8
  // ... match actual schema
};

// Mock database responses that match real query results
jest.mock("@/lib/database", () => ({
  knex: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis()
    // ... chain all query methods
  })
}));
```

#### Request Mocking

```typescript
// Consistent HTTP request mocking
const mockRequest = {
  parsedParams: {
    season_ids: [1, 2],
    league_ids: [3],
    team_ids: null,
    stages: [],
    map_ids: [5, 6]
  },
  query: {
    /* raw query params */
  }
};

const mockResponse = {
  json: jest.fn(),
  status: jest.fn().mockReturnThis()
};
```

#### Middleware Testing

```typescript
// Test middleware in isolation
describe("parseQueryFilterParams middleware", () => {
  test("should parse season_ids correctly", () => {
    const req = { query: { season_ids: "1,2,3" } };
    const res = {};
    const next = jest.fn();

    parseQueryFilterParams(req, res, next);

    expect(req.parsedParams.season_ids).toEqual([1, 2, 3]);
    expect(next).toHaveBeenCalled();
  });
});
```

### Backend Testing Specifics

#### Model Testing

```typescript
// Test database models with proper setup/teardown
describe("Player Model", () => {
  beforeEach(async () => {
    await knex.migrate.rollback();
    await knex.migrate.latest();
    await knex.seed.run();
  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  test("should get player stats with correct JOINs", async () => {
    const stats = await getPlayerStats({ team_ids: [1] });

    expect(stats).toBeDefined();
    // Verify JOIN structure was used correctly
  });
});
```

#### Controller Testing

```typescript
// Test API controllers with mocked dependencies
describe("Players Controller", () => {
  test("should handle player stats request", async () => {
    const mockData = [
      /* test data */
    ];
    jest.spyOn(playerModel, "getPlayerStats").mockResolvedValue(mockData);

    const req = { parsedParams: { season_ids: [1] } };
    const res = { json: jest.fn() };

    await getPlayerStatsController(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockData
    });
  });
});
```

#### Integration Testing

```typescript
// Test complete request flows
describe("Player Stats API Integration", () => {
  test("should return filtered player stats", async () => {
    const response = await request(app)
      .get("/api/players/stats")
      .query({ season_ids: "1,2", team_ids: "3" })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  });
});
```

### Query Testing

#### Filter Parameter Testing

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

#### JOIN Testing

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

#### ParsedParams Testing

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

### Test Data Management

#### Seed Data

```typescript
// Use consistent test data representing realistic scenarios
const testSeedData = {
  seasons: [
    { id: 1, name: "Season 1", is_active: true },
    { id: 2, name: "Season 2", is_active: false }
  ],
  players: [
    { id: 1, steam_name: "TestPlayer1", steam_id: "12345" },
    { id: 2, steam_name: "TestPlayer2", steam_id: "67890" }
  ]
  // ... realistic test data
};
```

#### Data Cleanup

```typescript
// Ensure proper cleanup between test runs
beforeEach(async () => {
  await knex("PlayerStats").del();
  await knex("MatchGames").del();
  await knex("Matches").del();
  // Clean in reverse dependency order
});

afterEach(async () => {
  // Additional cleanup if needed
  await knex.raw("TRUNCATE TABLE player_stats RESTART IDENTITY CASCADE");
});
```

#### Database State Testing

```typescript
// Test both empty and populated database scenarios
describe("Database State Scenarios", () => {
  test("should handle empty database", async () => {
    // Test with no data
    const result = await getPlayerStats({});
    expect(result).toEqual([]);
  });

  test("should handle populated database", async () => {
    // Test with seeded data
    await seedTestData();
    const result = await getPlayerStats({});
    expect(result.length).toBeGreaterThan(0);
  });
});
```

### Error Handling Testing

#### Validation Testing

```typescript
// Test input validation with valid and invalid data
describe("Input Validation", () => {
  test("should accept valid filter parameters", () => {
    const validParams = { season_ids: [1, 2], team_ids: [3] };
    expect(() => validateFilterParams(validParams)).not.toThrow();
  });

  test("should reject invalid filter parameters", () => {
    const invalidParams = { season_ids: ["invalid"] };
    expect(() => validateFilterParams(invalidParams)).toThrow();
  });
});
```

#### Error Response Testing

```typescript
// Verify proper error responses and status codes
describe("Error Response Testing", () => {
  test("should return 400 for invalid parameters", async () => {
    const response = await request(app)
      .get("/api/players/stats")
      .query({ season_ids: "invalid" })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });

  test("should return 500 for database errors", async () => {
    jest.spyOn(knex, "select").mockRejectedValue(new Error("DB Error"));

    const response = await request(app).get("/api/players/stats").expect(500);

    expect(response.body.success).toBe(false);
  });
});
```

#### Edge Case Testing

```typescript
// Test boundary conditions and unexpected input
describe("Edge Cases", () => {
  test("should handle extremely large arrays", () => {
    const largeArray = Array.from({ length: 1000 }, (_, i) => i);
    const params = { season_ids: largeArray };
    // Test performance and limits
  });

  test("should handle special characters in input", () => {
    const params = { season_ids: ["1; DROP TABLE seasons;"] };
    // Test SQL injection prevention
  });
});
```

### Frontend Error Detection Setup

#### Comprehensive Error Monitoring

```typitten
// Complete error detection setup for frontend tests
let errors: string[] = [];

beforeEach(() => {
  errors = [];

  // Console error monitoring
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(`Console error: ${msg.text()}`);
    }
  });

  // Uncaught exception handling
  page.on("pageerror", (error) => {
    errors.push(`Page error: ${error.message}`);
  });

  // Network failure detection
  page.on("requestfailed", (request) => {
    errors.push(`Request failed: ${request.url()}`);
  });
});

// Error collection and cleanup
afterEach(() => {
  if (errors.length > 0) {
    throw new Error(`Frontend errors detected:\n${errors.join("\n")}`);
  }
});
```

### Performance Testing

#### Query Performance

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

#### Memory Usage Monitoring

```typescript
// Monitor memory usage in tests, especially for data-heavy operations
describe("Memory Usage", () => {
  test("should not leak memory during large operations", () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Perform memory-intensive operation
    for (let i = 0; i < 1000; i++) {
      // Process large datasets
    }

    // Force garbage collection
    if (global.gc) global.gc();

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // < 50MB increase
  });
});
```

## Performance Optimization Patterns

### Query Performance

- Use INNER JOINs for active filters (reduces result set)
- Use LEFT JOINs for optional data (preserves all results)
- Always include proper indexes on foreign keys
- Log query execution times in development

### Frontend Performance

- SWR caching prevents redundant requests
- Mobile-first design reduces initial payload
- Essential data only on small screens
- Progressive enhancement for larger screens

## Testing Architecture

### Frontend Testing Strategy

**Unit Testing with Jest + React Testing Library**

- **Primary Strategy**: Component-focused unit testing
- **Test Organization**: `/src/__tests__/unit/` for all Jest unit tests
- **Testing Library**: React Testing Library for user-centric testing
- **Mocking Strategy**: Mock hooks, API calls, and external dependencies

**E2E Testing with Playwright**

- **Secondary Strategy**: Multi-component testing with real backend
- **Test Organization**: `/src/__tests__/e2e/` for Playwright e2e tests
- **Testing Framework**: Playwright for browser automation
- **Backend Strategy**: Use real backend, no mocking of API calls

**Test File Structure**

```
/src/__tests__/unit/           # Jest unit tests for components
/src/__tests__/e2e/            # Playwright e2e tests for workflows
```

**Component Testing Patterns**

- **User-Centric**: Test from user perspective, not implementation details
- **Accessibility**: Use semantic queries (getByRole, getByLabelText) when possible
- **Mock External Dependencies**: API calls, hooks, and external services
- **Error States**: Test error handling and edge cases thoroughly

**E2E Testing Patterns**

- **Real Backend**: Use actual backend for API calls, no mocking
- **Multi-Component**: Test interactions between multiple components
- **User Workflows**: Focus on complete user journeys
- **Standalone Server**: Use standalone build for consistent testing environment
- **Backend Startup**: Start backend with `pnpm --filter=backend dev:e2e` for successful API requests
- **Response Stubbing**: Stub responses from backend endpoints that do external fetches outside our system
- **Future MSW Integration**: Research MSW server running outside Playwright to snoop on requests

**React 19 + Radix UI Testing Pattern**

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

**Testing Troubleshooting Priority**

1. **First**: Add ResizeObserver polyfill for any AggregateError with Radix UI components
2. **Second**: Only consider React downgrade if ResizeObserver polyfill doesn't work
3. **Always**: Bump back to React 19 once issues are resolved

### Backend Testing Strategy

**Unit Testing with Jest**

- **Test Organization**: `__tests__` folders alongside source files
- **Mocking**: Mock database, Redis, and external services
- **Coverage**: Test models, services, and controllers
- **Performance**: Test query response time boundaries

**Test Structure**

```
src/
├── __tests__/
│   ├── models/           # Database model tests
│   ├── services/         # Business logic tests
│   ├── controllers/      # API endpoint tests
│   └── middlewares/      # Middleware tests
```

### Testing Best Practices

**General Principles**

- **Test Behavior**: Focus on what the code does, not how it does it
- **Mock Strategy**: Mock external dependencies in unit tests, use real backend in e2e tests
- **User Perspective**: Test from the user's point of view
- **Error Handling**: Test error states and edge cases

**Test Quality**

- **Reliability**: Tests should pass consistently without flakiness
- **Maintainability**: Tests should be easy to understand and modify
- **Performance**: Tests should run quickly and efficiently
- **Documentation**: Tests should serve as living documentation

**Mocking Patterns**

```typescript
// Mock hooks
jest.mock("@/hooks/data/useAccountDetails", () => ({
  useAccountDetails: jest.fn()
}));

// Mock API calls
jest.mock("@/lib/apiClient", () => ({
  clientApiFetch: jest.fn()
}));

// Mock external services
jest.mock("ioredis", () => require("ioredis-mock"));
```

**Error Testing Patterns**

```typescript
// Test expected failures
await expect(serviceFunction(invalidData)).rejects.toThrow(/invalid/);

// Test specific error types
await expect(serviceFunction(invalidData)).rejects.toThrow(ValidationError);

// Test error messages
await expect(serviceFunction(invalidData)).rejects.toThrow(
  "Data validation failed"
);
```

### CI/CD Integration

**GitLab CI Testing**

- **Unit Tests**: Automated Jest testing for both frontend and backend
- **E2E Tests**: Automated Playwright testing for frontend workflows
- **Coverage Reporting**: Test coverage metrics and reporting
- **Quality Gates**: Tests must pass before deployment
- **Performance**: Fast test execution for quick feedback

**Test Commands**

```bash
# Frontend unit tests
cd apps/frontend && pnpm test

# Frontend e2e tests (all e2e tests) - FOR DEBUGGING ONLY
cd apps/frontend && pnpm test:e2e

# Frontend e2e tests (specific file) - FOR DEBUGGING ONLY
cd apps/frontend && pnpm test:e2e kanahautomo.test.ts

# Frontend e2e tests (specific test by title) - FOR DEBUGGING ONLY
cd apps/frontend && pnpm test:e2e -g "happy path: authenticated user can register for Kanahautomo"

# Frontend e2e tests (UI mode for debugging)
cd apps/frontend && pnpm test:e2e:ui kanahautomo.test.ts

# Frontend e2e tests (headed mode to see browser)
cd apps/frontend && pnpm test:e2e:headed kanahautomo.test.ts

# Backend unit tests
cd apps/backend && pnpm test

# All unit tests from monorepo root (fast feedback)
pnpm test

# All tests from monorepo root (comprehensive testing)
pnpm test:all

# E2E tests from monorepo root (RECOMMENDED - handles all setup automatically)
pnpm test:e2e

# E2E tests from monorepo root (specific file - RECOMMENDED)
pnpm test:e2e kanahautomo.test.ts

# TDD - Watch mode for unit tests (automatically runs on file changes)
pnpm test:watch
```

**What `pnpm test` from root runs:**

- Backend unit tests (Jest with coverage)
- Frontend unit tests (Jest + React Testing Library)
- Does NOT run e2e tests

**What `pnpm test:all` from root runs:**

- All unit tests (backend + frontend)
- All e2e tests with database setup
- Complete comprehensive testing suite

**TDD Commands:**

- **`pnpm test:watch`**: Watch mode - automatically runs unit tests when files change

**Testing Strategy Preference:**

- **`pnpm test`**: Fast unit tests for quick feedback during development
- **`pnpm test:e2e`**: E2E tests when you need to test complete workflows
- **`pnpm test:e2e <filename>`**: Run specific e2e test files for targeted testing
- **`pnpm test:all`**: Comprehensive testing when you need everything
- **`pnpm test:watch`**: TDD workflow with automatic test execution on file changes

**Monorepo E2E Testing (Recommended)**

```bash
# Run from monorepo root - handles all setup automatically
pnpm test:e2e

# Run specific e2e test file from monorepo root
pnpm test:e2e kanahautomo.test.ts
```

**What `pnpm test:e2e` from root does automatically:**

1. **Database Setup**: Runs `pnpm --filter=backend reseed:e2e` (resets and seeds database)
2. **Build**: Runs `pnpm build` (builds the entire project)
3. **E2E Tests**: Runs `pnpm --filter=frontend test:e2e` (executes Playwright tests)

**IMPORTANT**: Always run e2e tests from the monorepo root using `pnpm test:e2e`. This ensures:

- ✅ Database is properly set up with e2e test data
- ✅ Project is built with latest changes
- ✅ Backend is ready for e2e testing
- ✅ No manual backend setup required

**E2E Testing Setup (Alternative - Manual)**

```bash
# Only use this if you need manual control over the process
# Start backend for e2e testing
pnpm --filter=backend dev:e2e

# In another terminal, run e2e tests from frontend
cd apps/frontend && pnpm test:e2e

# Or run specific e2e test file
cd apps/frontend && pnpm test:e2e kanahautomo.test.ts
```

### Testing Tools & Libraries

**Frontend Testing**

- **Jest**: Test runner and assertion library
- **React Testing Library**: User-centric component testing
- **Jest DOM**: Custom matchers for DOM testing
- **Playwright**: E2E testing framework for browser automation
- **MSW**: Mock Service Worker for API mocking (when needed)

**Backend Testing**

- **Jest**: Test runner and assertion library
- **Supertest**: HTTP assertion library for API testing
- **ioredis-mock**: Redis mocking for tests
- **Knex**: Database query builder with test support

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

## Additional Rule: Always Verify Changes by Running Tests

After making any code or test changes, always run the relevant test suite (or the full suite if appropriate) to verify that:

- The new or updated tests pass
- No regressions are introduced
- The code behaves as expected

This step is mandatory for every TDD cycle and for any refactor or bug fix. Document test results if required by the workflow.

**Tip:** When verifying changes, prefer running only the relevant test file for speed and efficiency:

```bash
pnpm --filter=frontend test -- path/to/file.test.tsx
pnpm --filter=backend test -- path/to/file.test.ts
```

Use this targeted command during TDD or focused debugging, unless a full suite run is required.

## Debugging Pattern: Start Simple, Grow from There

### The Fundamental Issue: Premature Complexity Escalation

When debugging, avoid the cognitive bias of immediately jumping to complex solutions. The pattern is:

```
Simple Problem → Complex Hypothesis → Complex Solution → More Problems → Even More Complex Solutions
```

Instead, follow the **"Ladder of Complexity"** approach:

### The Ladder of Complexity Rule

Always start at the bottom rung and work your way up:

1. **Rung 1: Obvious Changes** - What just changed? (file moves, renames, etc.)
2. **Rung 2: Import/Path Issues** - Are references still valid?
3. **Rung 3: Configuration Issues** - Are settings/configs correct?
4. **Rung 4: Logic Issues** - Is the actual code logic wrong?
5. **Rung 5: Architecture Issues** - Are there deeper structural problems?

**Rule**: Don't jump to Rung 4 or 5 until you've eliminated 1-3.

### The "Occam's Razor" Approach

When debugging, ask: "What's the simplest explanation for this error?"

- File moved → paths broken → fix paths
- Not: File moved → complex React architecture issues → rewrite entire test strategy

### The "Change Correlation" Principle

If something breaks immediately after a change, the cause is likely **directly related** to that change, not some pre-existing complex issue.

### Trust User Domain Knowledge

When a user says "we only moved files, how can this break?" - they're usually right. Start with the most recent change and work backward, not forward into complexity.

### Ask the User for Context

Before jumping into complex debugging scenarios, ask the user:

1. **"Did this work before?"** - If yes, focus on what changed
2. **"What did you do before it stopped working?"** - The cause is likely in the recent changes
3. **"What was the last thing that worked?"** - This gives you a baseline to compare against

**Example**:

- User: "The test is failing"
- You: "Did this test pass before? What was the last change you made?"
- User: "Yes, it worked before I moved the files"
- You: "Then let's check if the import paths are still correct after the move"

This simple questioning can save hours of complex debugging by focusing on the actual cause.

### Example Pattern

**Problem**: Test fails after file refactoring
**Wrong Approach**: Assume complex React/import/architecture issues
**Right Approach**:

1. Check if import paths are updated
2. Check if mock paths match new component structure
3. Check if any new components need mocking
4. Only then consider complex scenarios

### General Rule

When debugging, always start with the **most recent change** and work backward, not forward into complexity.

# Player Skill Metrics Pattern

## Player Skill Diagram

The Player Skill Diagram feature uses a radar chart visualization to represent player performance across five key skill dimensions. This pattern demonstrates effective use of:

1. **Radar Chart Visualization**: Using Recharts to create a pentagonal radar chart
2. **Skill Dimension Calculation**: Breaking down player performance into 5 key metrics
3. **Comparison Capability**: Allowing comparison with team average, similar ranked players, or all players

### Component Structure

```tsx
// Parent component structure
<PlayerSkillTab steamId={steamId} filterQueryParams={filterParams} />
  ↓
<usePlayerSkillDiagram> // Data fetching hook
  ↓
<PlayerSkillRadar playerSkillData={data} compareSkillData={compareData} />
```

### Data Model

```typescript
interface PlayerSkillDiagram {
  steam_id: string;
  nickname: string;
  overall_rating: number;
  aim: number; // Mechanical skills (headshot %, accuracy)
  positioning: number; // Tactical awareness (opening duels, survival)
  impact: number; // Round outcome influence (clutches, multi-kills)
  utility: number; // Grenade/flash effectiveness
  consistency: number; // Performance stability across maps/sides
  detailed_metrics: {
    // Additional detailed metrics
    // Various sub-metrics that contribute to main categories
  };
}
```

### API Endpoints

```
GET /api/v1/players/:steam_id/skill-diagram
GET /api/v1/players/skill-diagram/aggregate
```

### Comparison Logic

The comparison feature allows players to compare their skills against different benchmarks:

```typescript
// Dynamic URL generation based on comparison type
let compareUrl: string | null = null;

if (compareOption === "aggregate") {
  // All players aggregate
  compareUrl = `/api/v1/players/skill-diagram/aggregate?${sortedQuery}`;
} else if (compareOption.startsWith("faceit_")) {
  // Faceit level comparison
  const faceitLevel = compareOption.split("_")[1];
  compareUrl = addParamsToUrl(baseUrl, { faceit_level: faceitLevel });
} else if (compareOption.startsWith("cs2rank_")) {
  // CS2 rank comparison
  const rankValue = compareOption.split("_")[1];
  const rankMin = parseInt(rankValue) - 500;
  const rankMax = parseInt(rankValue) + 500;
  compareUrl = addParamsToUrl(baseUrl, {
    cs2_rank_min: rankMin,
    cs2_rank_max: rankMax
  });
} else if (compareOption === "team" && playerTeam?.team_id) {
  // Player's own team
  compareUrl = addParamsToUrl(baseUrl, { team_ids: playerTeam.team_id });
}
```

### Team Data Pre-fetching

To enable team comparison, the player's team data is pre-fetched when the component loads:

```typescript
// Pre-fetch player's team when component loads
useEffect(() => {
  const fetchPlayerTeam = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/v1/filters/players/${steamId}/teams`
      );
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
          setPlayerTeam({
            team_id: data[0].team_id,
            team_name: data[0].team_name
          });
        }
      }
    } catch (error) {
      console.error("Error fetching player team:", error);
    }
  };

  fetchPlayerTeam();
}, [steamId, filterQueryParams]);
```

### Dynamic Comparison Options

The comparison options are dynamically generated based on available data:

```typescript
// Generate comparison options based on whether player has a team
const getCompareOptionGroups = (hasTeam: boolean): CompareOptionGroup[] => {
  const generalOptions = [
    { value: "none", label: "No comparison" },
    { value: "aggregate", label: "All players" }
  ];

  if (hasTeam) {
    generalOptions.push({ value: "team", label: "Player's team" });
  }

  return [
    {
      label: "General",
      options: generalOptions
    },
    {
      label: "Faceit Levels",
      options: Array.from({ length: 10 }, (_, i) => ({
        value: `faceit_${i + 1}`,
        label: `Faceit Level ${i + 1}`
      }))
    },
    {
      label: "CS2 Ranks",
      options: generateCS2RankOptions()
    }
  ];
};
```

This pattern demonstrates effective use of:

1. **Component Composition**: Clean separation of data fetching, visualization, and UI controls
2. **Dynamic API Requests**: Building API requests based on user selection
3. **Conditional UI Elements**: Showing comparison options only when relevant data is available
4. **Data Pre-fetching**: Loading necessary data (team details) when component mounts
5. **Filter Parameter Integration**: Using the same filter parameters across the application
