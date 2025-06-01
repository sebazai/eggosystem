# Backend

This is the backend application for the Kanaliiga Eggosystem project.

## E2E Testing Mode

For E2E testing, the backend supports a special mode that mocks external API calls (Steam, FACEIT) to ensure reliable and fast testing without depending on external services.

### Running Backend in E2E Mode

```bash
# Start backend in E2E mode (with API mocking enabled)
pnpm dev:e2e

# Or set the environment variable manually
TEST_TYPE=e2e pnpm dev
```

### What Gets Mocked in E2E Mode

When `TEST_TYPE=e2e` or `NODE_ENV=e2e` is set, the following external APIs are mocked:

- **Steam API calls**:
  - `getSteamHoursForAppId()` - Returns 1500 hours for any Steam ID
  - `isSteamProfilePublic()` - Always returns `true` (public profile)
  - `areSteamProfilesPublic()` - Always returns `{ is_all_public: true }`

- **FACEIT API calls**:
  - `getFaceITGameRank()` - Returns mock rank data (level 7, elo 1850)
  - `getFaceITTeamDetails()` - Returns mock team data for any team ID

### Benefits

1. **Reliability**: Tests don't fail due to external API rate limits or downtime
2. **Speed**: No network calls to external services
3. **Consistency**: Same mock data returned every time
4. **Flexibility**: Can use any Steam IDs in tests without worrying about profile privacy

### Usage with E2E Tests

1. Start backend in E2E mode: `pnpm dev:e2e`
2. Run E2E tests: `cd ../frontend && pnpm test:e2e`
3. Backend will log mock API calls with `🎭 E2E Mock:` prefix for debugging 