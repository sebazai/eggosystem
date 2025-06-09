# System Patterns - Kanaliiga Eggosystem

## Architecture Overview

The Kanaliiga Eggosystem follows a monorepo structure using PNPM workspaces with clear separation between frontend and backend concerns.

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
    nextFetcher("/api/v1/endpoint", filters)
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

```typescript
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

### Test Categories and Structure

**Backend Tests** (`apps/backend/src/__tests__/`)

- **Unit Tests**: Service functions, models, utilities
- **Controller Tests**: API endpoint behavior with mocked dependencies
- **Pattern**: Use Jest with `supertest` for HTTP testing
- **Mocking**: Mock Redis, database, external APIs appropriately

**Frontend Tests** (`apps/frontend/src/__tests__/`)

```
__tests__/
├── unit/          # Component unit tests (isolated)
├── integration/   # Component integration (mocked APIs)
└── e2e/           # End-to-end flows (real backend)
```

**Integration vs E2E Decision Matrix**

- **Integration**: Component interactions, form behavior, UI state changes (mock APIs)
- **E2E**: Full user journeys, navigation flows, real data persistence (real backend)
- **Error Signal**: `ECONNREFUSED` errors indicate test is in wrong category

### Error Handling Patterns

**When to Use try/catch**

- ✅ JSON.parse() operations (can throw on malformed data)
- ✅ Data validation and transformation
- ✅ Database operations (actual integration boundary)
- ✅ External API calls (third-party services)
- ✅ Resource cleanup (files, connections)

**When NOT to Use try/catch**

- ❌ Redis operations (`redisClient.get()` returns null on errors)
- ❌ Simple validation (use validation libraries)
- ❌ Playwright navigation (has built-in retry mechanisms)
- ❌ Generic error swallowing

**Pattern**: Follow existing codebase patterns rather than adding defensive try/catch blocks

### Playwright Testing Patterns

**Navigation Helpers**

```typescript
// ✅ Simple and reliable
async function navigateToPage(page: Page, url: string) {
  await page.goto(url, { timeout: 60000 });
  await page.waitForLoadState("domcontentloaded", { timeout: 30000 });
}

// ❌ Unnecessary complexity
async function navigateWithRetry(page: Page, url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      /* ... */
    } catch {
      /* ... */
    }
  }
}
```

**Test Reliability**

- Use Playwright's built-in retry and timeout mechanisms
- Mock external dependencies consistently
- Separate concerns: integration tests mock APIs, E2E tests use real backend

### E2E Testing Database Management

**Critical Database Reset Pattern**

```bash
# ALWAYS run this sequence before/after E2E tests
cd apps/backend && pnpm run reseed && pnpm run seed && pnpm run seed:e2e
```

**Why Database Reset is Critical**

- E2E tests modify real database state
- Email verification consumes tokens (sets to NULL, deletes from Redis)
- User registrations create permanent records
- Parallel test execution can conflict over shared resources
- Tests may fail due to "consumed" data from previous runs

**Test Isolation Strategies**

```typescript
// ✅ Create multiple test tokens in seed to prevent conflicts
const validTokenAccounts = [
  { id: 100, token: "valid-token-123", email: "test1@kanaliiga.fi" },
  { id: 102, token: "valid-token-456", email: "test2@kanaliiga.fi" },
  { id: 103, token: "valid-token-789", email: "test3@kanaliiga.fi" }
  // ... more tokens for parallel test execution
];

// ✅ Use different tokens for different tests
test("success case 1", () => {
  await navigateToPage(page, "/verify-email?token=valid-token-123");
});

test("success case 2", () => {
  await navigateToPage(page, "/verify-email?token=valid-token-456");
});

// ❌ Reusing tokens causes test isolation failures
test("success case 1", () => {
  await navigateToPage(page, "/verify-email?token=shared-token");
});
test("success case 2", () => {
  await navigateToPage(page, "/verify-email?token=shared-token"); // FAILS if first test consumed it
});
```

**Debugging DOM Element Issues**

```typescript
// ✅ Comprehensive DOM inspection for failing selectors
async function debugPageElements(page: Page, state: string) {
  // Find all SVG elements and their actual classes
  const svgElements = await page.$$eval("svg", (elements) =>
    elements.map((el) => ({
      className: el.className.baseVal || el.className,
      classList: Array.from(el.classList || []),
      attributes: Array.from(el.attributes).map(
        (attr) => `${attr.name}="${attr.value}"`
      ),
      outerHTML: el.outerHTML.substring(0, 200) + "..."
    }))
  );

  // Test different selector strategies
  const strategies = [
    "svg.lucide-circle-check-big", // Actual Lucide class
    "svg.lucide-circle-x", // Actual Lucide class
    '[data-testid="check-circle-icon"]' // May not work with Lucide
  ];

  for (const strategy of strategies) {
    const count = await page.locator(strategy).count();
    console.log(`Strategy "${strategy}": ${count} found`);
  }
}
```

**Test Reliability**

- Use Playwright's built-in retry and timeout mechanisms
- Mock external dependencies consistently
- Separate concerns: integration tests mock APIs, E2E tests use real backend

## Email Template Patterns

### HTML Email Best Practices

**Button Centering**

```html
<!-- ✅ Reliable across all email clients -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
  <tr>
    <td style="text-align: center;">
      <a
        href="..."
        style="background-color: hsl(35, 93%, 49%); color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; text-align: center;"
      >
        Button Text
      </a>
    </td>
  </tr>
</table>

<!-- ❌ Unreliable in Outlook and other clients -->
<div style="text-align: center;">
  <a href="..." style="...">Button Text</a>
</div>
```

**Email Client Compatibility**

- Use table-based layouts for critical structural elements
- Avoid flexbox, grid, and modern CSS for layout
- Test in Outlook (worst CSS support) and Gmail (good reference)
- Inline styles only - external stylesheets are stripped
- Use `cellpadding="0" cellspacing="0"` on all tables

**Kanaliiga Brand Colors**

- Primary orange: `hsl(35, 93%, 49%)`
- Secondary link color: `hsl(29, 56%, 58%)`
- Text color: `#333`
- Muted text: `#777`

## Backend Testing Patterns

### Test Organization Structure

```
apps/backend/
├── src/
│   ├── controllers/
│   │   ├── playerController.ts
│   │   └── __tests__/
│   │       └── playerController.test.ts
│   ├── services/
│   │   ├── playerService.ts
│   │   └── __tests__/
│   │       └── playerService.test.ts
│   └── models/
│       ├── playerModel.ts
│       └── __tests__/
│           └── playerModel.test.ts
```

### Jest Configuration Patterns

```javascript
// jest.config.js - Backend
module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/__tests__/**/*"
  ]
};
```

### Mocking Strategy Patterns

#### Database Mocking (Unit Tests)

```typescript
// Unit tests - Mock database layer
import * as db from "../database";

jest.mock("../database", () => ({
  query: jest.fn(),
  transaction: jest.fn()
}));

const mockDb = db as jest.Mocked<typeof db>;

describe("PlayerService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get player stats", async () => {
    mockDb.query.mockResolvedValue([{ id: 1, name: "Player1" }]);

    const result = await playerService.getStats(1);

    expect(result).toEqual([{ id: 1, name: "Player1" }]);
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT"),
      [1]
    );
  });
});
```

#### Redis Mocking

```typescript
// Redis mocking pattern
import { createClient } from "redis";

jest.mock("redis", () => ({
  createClient: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn()
  }))
}));

const mockRedis = createClient() as jest.Mocked<
  ReturnType<typeof createClient>
>;
```

#### External Service Mocking

```typescript
// Mock external APIs completely
jest.mock("../services/steamApi", () => ({
  fetchPlayerData: jest.fn(),
  fetchMatchData: jest.fn()
}));

// Define specific responses for each test
mockSteamApi.fetchPlayerData.mockResolvedValue({
  steamId: "123",
  name: "TestPlayer"
});
```

### Controller Testing Patterns

```typescript
// Integration testing for controllers
import request from "supertest";
import { app } from "../app";

describe("Player Controller", () => {
  beforeEach(async () => {
    // Reset database to known state
    await resetTestDatabase();
  });

  it("should return player stats", async () => {
    const response = await request(app)
      .get("/api/v1/players/1/stats")
      .query({
        season_ids: "1,2",
        league_ids: "1"
      })
      .expect(200);

    expect(response.body).toMatchSchema({
      type: "object",
      properties: {
        data: { type: "array" },
        total: { type: "number" }
      }
    });
  });
});
```

### Test Data Management

```typescript
// Test data factory pattern
export const createTestPlayer = (overrides = {}) => ({
  id: 1,
  steam_id: "76561198000000000",
  steam_name: "TestPlayer",
  ...overrides
});

export const createTestMatch = (overrides = {}) => ({
  id: 1,
  league_id: 1,
  season_id: 1,
  date: new Date("2025-01-01"),
  ...overrides
});

// Usage in tests
const testPlayer = createTestPlayer({ steam_name: "CustomName" });
```

### Error Testing Patterns

```typescript
// Testing error scenarios
describe("Error Handling", () => {
  it("should handle database connection errors", async () => {
    mockDb.query.mockRejectedValue(new Error("Connection failed"));

    await expect(playerService.getStats(1)).rejects.toThrow(
      "Database connection error"
    );
  });

  it("should handle validation errors", async () => {
    await expect(playerService.getStats(-1)).rejects.toThrow(ValidationError);
  });
});
```

### Performance Testing

```typescript
// Performance boundaries testing
describe("Performance", () => {
  it("should return player stats within 500ms", async () => {
    const start = Date.now();

    await playerService.getStats(1);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });
});
```

### Test Environment Setup

```typescript
// src/__tests__/setup.ts
import { setupTestDatabase, teardownTestDatabase } from "./helpers/database";

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

// Global test timeout
jest.setTimeout(10000);
```

### Snapshot Testing for API Responses

```typescript
// API response structure testing
it("should maintain consistent response structure", async () => {
  const response = await request(app)
    .get("/api/v1/players/1/stats")
    .expect(200);

  // Remove dynamic fields for snapshot
  const sanitized = {
    ...response.body,
    data: response.body.data.map((item) => ({
      ...item,
      id: "[DYNAMIC]",
      date: "[DYNAMIC]"
    }))
  };

  expect(sanitized).toMatchSnapshot();
});
```

## Testing Strategy (Testing Diamond Approach)

### Core Testing Philosophy

Following the **Testing Diamond** approach from Node.js testing best practices:

```
    Few E2E Tests (3-10 tests)
         /\
        /  \
       /    \
    MANY Component/Integration Tests (Primary Strategy)
       \    /
        \  /
         \/
    Few Unit Tests (Complex Logic Only)
```

### Component-First Testing Strategy

**Primary Testing Layer: Component/Integration Tests**

```typescript
// Component test - test entire API endpoint with real database
describe("GET /api/v1/players/:id/stats", () => {
  beforeEach(async () => {
    await setupTestDatabase();
    await seedTestData();
  });

  it("should return player statistics for valid player", async () => {
    const response = await request(app)
      .get("/api/v1/players/1/stats")
      .query({
        season_ids: "1,2",
        league_ids: "1"
      })
      .expect(200);

    expect(response.body).toMatchObject({
      data: expect.arrayContaining([
        expect.objectContaining({
          player_id: 1,
          kills: expect.any(Number),
          deaths: expect.any(Number),
          adr: expect.any(Number),
          rating: expect.any(Number)
        })
      ]),
      total: expect.any(Number)
    });
  });
});
```

### Feature-Based Testing (Not Function-Based)

**Focus on API Routes and Business Workflows:**

```typescript
// ✅ Good - Feature-based test
describe("Player Statistics Feature", () => {
  it("should calculate and return accurate player performance metrics", async () => {
    // Test complete workflow: request → validation → database → calculation → response
  });

  it("should filter statistics by season and league correctly", async () => {
    // Test complete filtering workflow
  });

  it("should handle pagination for large result sets", async () => {
    // Test complete pagination workflow
  });
});

// ❌ Avoid - Function-based unit tests as primary strategy
describe("calculatePlayerRating function", () => {
  it("should calculate rating correctly", () => {
    // Isolated function testing - use sparingly
  });
});
```

### Database-Included Testing Strategy

**Test with Real Database, Mock Only External Services:**

```typescript
// Component test setup - real database, mocked externals
describe("Player API Integration", () => {
  beforeEach(async () => {
    // Use real test database
    await resetTestDatabase();
    await seedRequiredData();

    // Mock only external services
    mockSteamAPI.fetchPlayerData.mockResolvedValue({
      /* mock data */
    });
  });

  it("should sync player data from Steam API and store correctly", async () => {
    // Test: API call → Steam API integration → Database storage → Response
    const response = await request(app)
      .post("/api/v1/players/sync")
      .send({ steam_id: "76561198000000000" })
      .expect(200);

    // Verify database was updated
    const player = await db.query(
      "SELECT * FROM SteamPlayers WHERE steam_id = ?",
      ["76561198000000000"]
    );
    expect(player).toHaveLength(1);
  });
});
```

### E2E Testing Strategy (Minimal)

**Only 3-10 E2E Tests for Critical Paths:**

```typescript
// E2E test - full system with real external services
describe("E2E: Complete Player Statistics Workflow", () => {
  it("should handle complete player lookup from external API to frontend display", async () => {
    // Test with real Steam API, real database, full frontend flow
    // Only for most critical user journeys
  });
});
```

### Test Performance Requirements

**Component Tests Must Be Fast:**

```typescript
// Performance requirements for component tests
describe("Performance Requirements", () => {
  it("should return player stats within 500ms", async () => {
    const start = Date.now();

    await request(app).get("/api/v1/players/1/stats").expect(200);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });
});

// Target: 40+ tests running in under 5 seconds
```

### Unit Testing (Selective Use Only)

**Unit Tests Only for Complex Business Logic:**

```typescript
// Unit test - only for non-trivial algorithms
describe("Player Rating Calculation Algorithm", () => {
  it("should calculate HLTV-style rating correctly", () => {
    // Test complex mathematical calculations in isolation
    const rating = calculatePlayerRating({
      kills: 25,
      deaths: 15,
      adr: 85.5,
      rounds: 30
    });

    expect(rating).toBeCloseTo(1.25, 2);
  });
});
```

### Test Organization Strategy

```
apps/backend/src/
├── __tests__/
│   ├── component/           # Primary testing layer
│   │   ├── players.test.ts
│   │   ├── matches.test.ts
│   │   └── teams.test.ts
│   ├── unit/               # Selective use only
│   │   └── algorithms/
│   │       └── rating-calculation.test.ts
│   └── e2e/               # Minimal critical paths
│       └── player-workflow.test.ts
└── controllers/
    ├── playerController.ts
    └── matchController.ts
```

### Test Data Strategy

**Fast Database Setup with Isolation:**

```typescript
// Test database optimization
const testDbSetup = {
  // Use separate test database
  database: "kanaliiga_test",

  // Fast seeding strategy
  seedStrategy: "essential-data-only",

  // Isolation approach
  isolation: "transaction-rollback", // vs full table truncation

  // Performance target
  setupTime: "<100ms per test"
};
```

## Integration Testing Patterns (Section 5)

### Third-Party Service Testing

**Strategy: Test Contracts, Not Implementations**

```typescript
// Contract testing for external APIs
describe("Steam API Integration", () => {
  it("should handle Steam API response format correctly", async () => {
    // Use real Steam API occasionally for contract validation
    const response = await steamApiService.getPlayerSummaries([
      "76561198000000000"
    ]);

    expect(response).toMatchObject({
      response: {
        players: expect.arrayContaining([
          expect.objectContaining({
            steamid: expect.any(String),
            personaname: expect.any(String),
            profileurl: expect.any(String)
          })
        ])
      }
    });
  });

  it("should gracefully handle Steam API failures", async () => {
    // Mock API failure scenarios
    nock("https://api.steampowered.com")
      .get("/ISteamUser/GetPlayerSummaries/v0002/")
      .reply(500, "Internal Server Error");

    await expect(
      steamApiService.getPlayerSummaries(["invalid"])
    ).rejects.toThrow("Steam API unavailable");
  });
});
```

### Service Virtualization Patterns

```typescript
// Use tools like nock for HTTP service mocking
import nock from "nock";

describe("External Service Integration", () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  it("should handle FaceIT API rate limiting", async () => {
    nock("https://open-api.faceit.com")
      .get("/data/v4/teams/team-id")
      .reply(429, { message: "Rate limit exceeded" });

    const result = await faceitService.getTeamDetails("team-id");

    expect(result).toBeNull(); // Graceful degradation
  });
});
```

### Consumer-Driven Contract Testing

```typescript
// Define API contracts that both services must honor
const playerStatsContract = {
  request: {
    method: "GET",
    path: "/api/v1/players/*/stats",
    query: {
      season_ids: "string",
      league_ids: "string?"
    }
  },
  response: {
    status: 200,
    body: {
      data: "array",
      total: "number"
    }
  }
};

// Test that our API honors the contract
it("should conform to player stats API contract", async () => {
  const response = await request(app)
    .get("/api/v1/players/1/stats")
    .query({ season_ids: "1,2" })
    .expect(200);

  expect(response.body).toMatchContract(playerStatsContract.response.body);
});
```

## Dealing with Data Patterns (Section 6)

### Test Data Isolation Strategies

**Database Per Test vs Transaction Rollback:**

```typescript
// Strategy 1: Transaction-based isolation (faster)
describe("Player Stats with Transaction Isolation", () => {
  let transaction: Transaction;

  beforeEach(async () => {
    transaction = await db.transaction();
  });

  afterEach(async () => {
    await transaction.rollback();
  });

  it("should calculate player rating correctly", async () => {
    // All database operations use the transaction
    await createTestPlayer({ id: 1, steam_name: "TestPlayer" }, transaction);

    const stats = await getPlayerStats(1, { transaction });
    expect(stats.rating).toBeCloseTo(1.2, 2);
  });
});

// Strategy 2: Database reset (more isolation, slower)
describe("Integration Tests with Full Reset", () => {
  beforeEach(async () => {
    await resetTestDatabase();
    await seedEssentialData();
  });

  it("should handle complex multi-table operations", async () => {
    // Full database operations
  });
});
```

### Test Data Builders (Factory Pattern)

```typescript
// Hierarchical test data creation
class TestDataBuilder {
  static async createSeason(overrides = {}) {
    return await db("Seasons").insert({
      name: "Test Season",
      full_name: "Test Season 2025",
      start_date: new Date("2025-01-01"),
      end_date: new Date("2025-12-31"),
      ...overrides
    });
  }

  static async createPlayerWithStats(seasonId: number, overrides = {}) {
    const player = await this.createPlayer();
    const match = await this.createMatch(seasonId);
    const game = await this.createMatchGame(match.id);

    return await this.createPlayerStats({
      player_id: player.id,
      game_id: game.id,
      kills: 25,
      deaths: 15,
      assists: 8,
      ...overrides
    });
  }

  static async createCompleteMatchScenario(seasonId: number) {
    const teams = await Promise.all([
      this.createTeam({ name: "Team A" }),
      this.createTeam({ name: "Team B" })
    ]);

    const match = await this.createMatch(seasonId, teams);
    const games = await this.createMatchGames(match.id, 3); // Best of 3

    // Create realistic player stats for both teams
    for (const game of games) {
      await this.createTeamStats(teams[0].id, game.id);
      await this.createTeamStats(teams[1].id, game.id);
    }

    return { match, teams, games };
  }
}
```

### Database Optimization for Tests

```typescript
// Optimized database setup
const testDbConfig = {
  // Use in-memory SQLite for unit tests
  client: "sqlite3",
  connection: ":memory:",
  useNullAsDefault: true,
  migrations: {
    directory: "./migrations"
  },
  seeds: {
    directory: "./seeds/test"
  },
  pool: {
    min: 1,
    max: 1 // Single connection for consistency
  }
};

// Parallel-safe test data
describe("Parallel Test Safety", () => {
  beforeEach(async () => {
    // Use unique test prefixes to avoid conflicts
    const testPrefix = `test_${Date.now()}_${Math.random()}`;
    await createIsolatedTestData(testPrefix);
  });
});
```

## Web Server Setup Patterns (Section 3)

### Efficient Server Lifecycle Management

```typitten
// Global test server setup
let testServer: Application;
let serverPort: number;

beforeAll(async () => {
  // Start server once for all tests
  testServer = createApp({
    database: testDbConfig,
    redis: mockRedisConfig,
    externalServices: mockServicesConfig
  });

  serverPort = await startServer(testServer, 0); // Random available port
});

afterAll(async () => {
  await stopServer(testServer);
  await cleanupTestDatabase();
});

// Per-test cleanup without server restart
beforeEach(async () => {
  await resetTestData(); // Fast data reset, keep server running
});
```

### Test-Specific Configuration

```typescript
// Environment-aware server configuration
const createTestApp = (overrides = {}) => {
  const config = {
    ...defaultConfig,
    database: {
      ...defaultConfig.database,
      connection: process.env.TEST_DATABASE_URL || ":memory:"
    },
    redis: {
      ...defaultConfig.redis,
      client:
        process.env.NODE_ENV === "test" ? mockRedisClient : realRedisClient
    },
    externalServices: {
      steamApi: {
        enabled: false, // Disable in tests
        mockResponses: steamApiMockData
      }
    },
    ...overrides
  };

  return createApplication(config);
};
```

## Test Anatomy Best Practices (Section 4)

### AAA Pattern (Arrange-Act-Assert)

```typescript
describe("Player Statistics Calculation", () => {
  it("should calculate K/D ratio correctly for multiple games", async () => {
    // Arrange - Set up test data
    const playerId = await createTestPlayer();
    const matchGames = await createMatchGames([
      { kills: 20, deaths: 10 }, // Game 1: 2.0 K/D
      { kills: 15, deaths: 20 }, // Game 2: 0.75 K/D
      { kills: 25, deaths: 15 } // Game 3: 1.67 K/D
    ]);

    await Promise.all(
      matchGames.map((game) =>
        createPlayerStats({
          player_id: playerId,
          game_id: game.id,
          kills: game.kills,
          deaths: game.deaths
        })
      )
    );

    // Act - Execute the function under test
    const stats = await calculatePlayerSummaryStats(playerId);

    // Assert - Verify the results
    expect(stats.totalKills).toBe(60);
    expect(stats.totalDeaths).toBe(45);
    expect(stats.kdRatio).toBeCloseTo(1.33, 2);
    expect(stats.gamesPlayed).toBe(3);
  });
});
```

### Test Naming Best Practices

```typescript
// Good test names: Should/When/Given pattern
describe("Player Rating System", () => {
  describe("when player has consistent performance", () => {
    it("should maintain stable rating over multiple matches", async () => {
      // Test implementation
    });
  });

  describe("when player performance varies significantly", () => {
    it("should adjust rating based on recent performance weight", async () => {
      // Test implementation
    });
  });

  describe("given insufficient match data", () => {
    it("should return null rating with appropriate message", async () => {
      // Test implementation
    });
  });
});
```

### Error Scenario Testing

```typescript
// Comprehensive error scenario coverage
describe("Error Handling", () => {
  it("should handle database connection failures gracefully", async () => {
    // Simulate connection failure
    mockDatabase.query.mockRejectedValue(new Error("Connection timeout"));

    await expect(getPlayerStats(1)).rejects.toThrow(
      "Database unavailable. Please try again later."
    );
  });

  it("should validate input parameters strictly", async () => {
    const invalidInputs = [
      null,
      undefined,
      "",
      "invalid",
      -1,
      0,
      "1; DROP TABLE players;"
    ];

    for (const invalidInput of invalidInputs) {
      await expect(getPlayerStats(invalidInput)).rejects.toThrow(
        /Invalid player ID/
      );
    }
  });

  it("should handle rate limiting from external APIs", async () => {
    mockSteamApi.getPlayerData.mockRejectedValue(
      new Error("Rate limit exceeded")
    );

    const result = await syncPlayerData("76561198000000000");

    expect(result.success).toBe(false);
    expect(result.error).toContain("rate limit");
    expect(result.retryAfter).toBeGreaterThan(0);
  });
});
```

### Performance Boundary Testing

```typescript
describe("Performance Requirements", () => {
  it("should return player stats within performance SLA", async () => {
    // Create realistic dataset
    await createLargeDataset({
      players: 1000,
      matches: 500,
      gamesPerMatch: 3
    });

    const performanceTests = [
      { playerId: 1, maxTime: 200 }, // Simple query
      { playerId: 50, maxTime: 350 }, // Medium complexity
      { playerId: 100, maxTime: 500 } // Complex aggregation
    ];

    for (const test of performanceTests) {
      const start = Date.now();
      const result = await getPlayerStats(test.playerId);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(test.maxTime);
      expect(result).toBeDefined();
    }
  });

  it("should handle concurrent requests efficiently", async () => {
    const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
      getPlayerStats(i + 1)
    );

    const start = Date.now();
    const results = await Promise.all(concurrentRequests);
    const totalDuration = Date.now() - start;

    // All requests should complete within reasonable time
    expect(totalDuration).toBeLessThan(2000);
    expect(results).toHaveLength(10);
    expect(results.every((r) => r !== null)).toBe(true);
  });
});
```
