# System Patterns - Kanaliiga Eggosystem

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
query = query.join('SeasonTeamPlayers as stp', teamJoinType, 'stp.player_id', 'sp.id');

// Prevents data exclusion when filters aren't applied
```

### Query Debugging Pattern
All database queries should include logging for debugging:
```typescript
console.log('Query:', query.toString());
console.log('Parameters:', params);
```

## API Middleware Patterns

### Filter Parameter Processing
Every filtering endpoint MUST use this pattern:

```typescript
// Route definition
router.get('/endpoint', parseQueryFilterParams, controller);

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
  const { data, error, isLoading } = useSWR(
    ['endpoint', filters],
    () => nextFetcher('/api/v1/endpoint', filters)
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

### Navigation Pattern
```tsx
// Consistent navigation - NO back buttons
import { AutoBreadcrumbs } from '@/components/layout';

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
import { MultiFilters, useFilters } from '@/components/filters';

function PageWithFilters() {
  const {
    seasons, leagues, stages, teams, maps,
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
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    errors.push(`Console error: ${msg.text()}`);
  }
});

page.on('pageerror', (error) => {
  errors.push(`Page error: ${error.message}`);
});

page.on('requestfailed', (request) => {
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
import { generateFiltersParamQuery } from '@/lib/utils';

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
apps/backend/src/__tests__/models/player.test.ts
apps/backend/src/__tests__/controllers/players.test.ts
apps/frontend/src/components/__tests__/player-table.test.tsx
```

#### Test Organization
```typescript
// Group tests by feature/module with clear describe blocks
describe('Player Statistics', () => {
  describe('when filtering by team', () => {
    test('should return only players from specified teams', () => { /* ... */ });
    test('should handle multiple team filters', () => { /* ... */ });
  });

  describe('when filtering by season', () => {
    test('should apply active season by default', () => { /* ... */ });
    test('should handle empty season arrays', () => { /* ... */ });
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
    database: 'kanaliiga_test'
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
  deaths: 8,
  // ... match actual schema
};

// Mock database responses that match real query results
jest.mock('@/lib/database', () => ({
  knex: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
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
  query: { /* raw query params */ }
};

const mockResponse = {
  json: jest.fn(),
  status: jest.fn().mockReturnThis()
};
```

#### Middleware Testing
```typescript
// Test middleware in isolation
describe('parseQueryFilterParams middleware', () => {
  test('should parse season_ids correctly', () => {
    const req = { query: { season_ids: '1,2,3' } };
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
describe('Player Model', () => {
  beforeEach(async () => {
    await knex.migrate.rollback();
    await knex.migrate.latest();
    await knex.seed.run();
  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  test('should get player stats with correct JOINs', async () => {
    const stats = await getPlayerStats({ team_ids: [1] });
    
    expect(stats).toBeDefined();
    // Verify JOIN structure was used correctly
  });
});
```

#### Controller Testing
```typescript
// Test API controllers with mocked dependencies
describe('Players Controller', () => {
  test('should handle player stats request', async () => {
    const mockData = [/* test data */];
    jest.spyOn(playerModel, 'getPlayerStats').mockResolvedValue(mockData);

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
describe('Player Stats API Integration', () => {
  test('should return filtered player stats', async () => {
    const response = await request(app)
      .get('/api/players/stats')
      .query({ season_ids: '1,2', team_ids: '3' })
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
describe('Filter Parameter Testing', () => {
  describe('empty arrays', () => {
    test('should handle empty season_ids', () => {
      const params = { season_ids: [] };
      // Test behavior with empty arrays
    });
  });

  describe('null values', () => {
    test('should handle null team_ids', () => {
      const params = { team_ids: null };
      // Test null handling
    });
  });

  describe('invalid IDs', () => {
    test('should handle non-numeric IDs', () => {
      const params = { season_ids: ['invalid'] };
      // Test validation
    });
  });

  describe('multiple filters combined', () => {
    test('should handle complex filter combinations', () => {
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
describe('Database JOIN Testing', () => {
  test('should use correct PlayerStats JOIN pattern', () => {
    const query = buildPlayerStatsQuery({ team_ids: [1] });
    
    expect(query.toString()).toContain('INNER JOIN MatchGames mg ON ps.game_id = mg.id');
    expect(query.toString()).toContain('INNER JOIN Matches m ON mg.match_id = m.id');
  });

  test('should use dynamic JOIN types for team filtering', () => {
    const queryWithTeam = buildPlayerStatsQuery({ team_ids: [1] });
    const queryWithoutTeam = buildPlayerStatsQuery({ team_ids: null });
    
    expect(queryWithTeam.toString()).toContain('INNER JOIN SeasonTeamPlayers');
    expect(queryWithoutTeam.toString()).toContain('LEFT JOIN SeasonTeamPlayers');
  });
});
```

#### ParsedParams Testing
```typescript
// Ensure middleware correctly parses query parameters
describe('ParsedParams Middleware Testing', () => {
  test('should parse comma-separated IDs', () => {
    const req = { query: { season_ids: '1,2,3' } };
    parseQueryFilterParams(req, {}, () => {});
    
    expect(req.parsedParams.season_ids).toEqual([1, 2, 3]);
  });

  test('should handle single ID values', () => {
    const req = { query: { league_ids: '5' } };
    parseQueryFilterParams(req, {}, () => {});
    
    expect(req.parsedParams.league_ids).toEqual([5]);
  });

  test('should set null for missing parameters', () => {
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
    { id: 1, name: 'Season 1', is_active: true },
    { id: 2, name: 'Season 2', is_active: false }
  ],
  players: [
    { id: 1, steam_name: 'TestPlayer1', steam_id: '12345' },
    { id: 2, steam_name: 'TestPlayer2', steam_id: '67890' }
  ],
  // ... realistic test data
};
```

#### Data Cleanup
```typescript
// Ensure proper cleanup between test runs
beforeEach(async () => {
  await knex('PlayerStats').del();
  await knex('MatchGames').del();
  await knex('Matches').del();
  // Clean in reverse dependency order
});

afterEach(async () => {
  // Additional cleanup if needed
  await knex.raw('TRUNCATE TABLE player_stats RESTART IDENTITY CASCADE');
});
```

#### Database State Testing
```typescript
// Test both empty and populated database scenarios
describe('Database State Scenarios', () => {
  test('should handle empty database', async () => {
    // Test with no data
    const result = await getPlayerStats({});
    expect(result).toEqual([]);
  });

  test('should handle populated database', async () => {
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
describe('Input Validation', () => {
  test('should accept valid filter parameters', () => {
    const validParams = { season_ids: [1, 2], team_ids: [3] };
    expect(() => validateFilterParams(validParams)).not.toThrow();
  });

  test('should reject invalid filter parameters', () => {
    const invalidParams = { season_ids: ['invalid'] };
    expect(() => validateFilterParams(invalidParams)).toThrow();
  });
});
```

#### Error Response Testing
```typescript
// Verify proper error responses and status codes
describe('Error Response Testing', () => {
  test('should return 400 for invalid parameters', async () => {
    const response = await request(app)
      .get('/api/players/stats')
      .query({ season_ids: 'invalid' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });

  test('should return 500 for database errors', async () => {
    jest.spyOn(knex, 'select').mockRejectedValue(new Error('DB Error'));
    
    const response = await request(app)
      .get('/api/players/stats')
      .expect(500);

    expect(response.body.success).toBe(false);
  });
});
```

#### Edge Case Testing
```typescript
// Test boundary conditions and unexpected input
describe('Edge Cases', () => {
  test('should handle extremely large arrays', () => {
    const largeArray = Array.from({ length: 1000 }, (_, i) => i);
    const params = { season_ids: largeArray };
    // Test performance and limits
  });

  test('should handle special characters in input', () => {
    const params = { season_ids: ['1; DROP TABLE seasons;'] };
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
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`Console error: ${msg.text()}`);
    }
  });

  // Uncaught exception handling
  page.on('pageerror', (error) => {
    errors.push(`Page error: ${error.message}`);
  });

  // Network failure detection
  page.on('requestfailed', (request) => {
    errors.push(`Request failed: ${request.url()}`);
  });
});

// Error collection and cleanup
afterEach(() => {
  if (errors.length > 0) {
    throw new Error(`Frontend errors detected:\n${errors.join('\n')}`);
  }
});
```

### Performance Testing

#### Query Performance
```typescript
// Test database queries perform efficiently with larger datasets
describe('Query Performance', () => {
  test('should execute player stats query within time limit', async () => {
    const startTime = Date.now();
    await getPlayerStats({ season_ids: [1, 2] });
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(1000); // < 1 second
  });

  test('should handle large result sets efficiently', async () => {
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
describe('Memory Usage', () => {
  test('should not leak memory during large operations', () => {
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