# Database Operations Guide

This guide provides practical information for working with the Kanaliiga database, including common queries, troubleshooting, and migration patterns.

For architectural information and design decisions, see [`/README.database.md`](../README.database.md).

## Common Queries

### Get Player Account Information

```sql
SELECT a.*, sp.steam_id, sp.nickname, sp.faceit_id
FROM Accounts a
JOIN LinkedAccounts la ON a.id = la.account_id
JOIN SteamPlayers sp ON la.provider_id = CAST(sp.steam_id AS CHAR)
WHERE la.provider = 'steam' AND sp.steam_id = ?;
```

**Usage**: Core query for player authentication and profile data.

### Get Team Captain Information

```sql
SELECT sp.steam_id, sp.nickname, strp.is_captain, strp.is_co_captain
FROM SeasonTeamRegistrationPlayers strp
JOIN SteamPlayers sp ON strp.steam_id = sp.steam_id
WHERE strp.season_id = ? AND strp.team_id = ?
AND (strp.is_captain = 1 OR strp.is_co_captain = 1);
```

**Usage**: Used for permission validation and team management.

### Get Player Permissions

```sql
SELECT p.permission_name, aps.season_id, aps.team_id
FROM AccountPermissionScopes aps
JOIN Permissions p ON aps.permission_id = p.id
WHERE aps.account_id = ?;
```

**Usage**: Authorization checks for API endpoints and UI features.

### Get Active Team Roster

```sql
SELECT sp.steam_id, sp.nickname, stp.role, stp.is_captain, stp.is_co_captain
FROM SeasonTeamPlayers stp
JOIN SteamPlayers sp ON stp.steam_id = sp.steam_id
WHERE stp.season_id = ? AND stp.team_id = ?;
```

**Usage**: Display current team roster for matches (not registration roster).

### Get Match Teams with Registration Validation

```sql
SELECT mt.match_id, mt.team_id, t.name, m.season_id, m.league_id
FROM MatchTeams mt
JOIN Teams t ON mt.team_id = t.id
JOIN Matches m ON mt.match_id = m.id
WHERE mt.match_id = ?;
```

**Usage**: Retrieve teams for a match with season/league context.

## Migration Considerations

### Before Writing Migrations

1. **Always check triggers**: Many business rules are enforced by triggers
2. **Respect foreign key constraints**: Use proper CASCADE behaviors
3. **Consider unique constraints**: Especially for Steam IDs and external platform IDs
4. **Account linking**: Use the `get_account_id_from_steam_id` function for Steam ID lookups
5. **Permission management**: Captain permissions are automatically managed by triggers
6. **Dual-roster system**: Understand the difference between registration and active rosters
7. **Steam ID handling**: Steam ID is primary identity throughout the system

### Migration Patterns

#### Adding a Foreign Key to an Existing Table

```typescript
export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("TableName", (table) => {
    table.integer("new_column_id").unsigned().notNullable();
    table
      .foreign("new_column_id")
      .references("id")
      .inTable("ReferencedTable")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}
```

#### Adding a Composite Foreign Key

```typescript
export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("TableName", (table) => {
    table
      .foreign(["season_id", "team_id"])
      .references(["season_id", "team_id"])
      .inTable("SeasonTeamRegistrations")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}
```

#### Creating a Trigger

```typescript
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TRIGGER trigger_name
    AFTER INSERT ON TableName
    FOR EACH ROW
    BEGIN
      -- Trigger logic here
    END
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TRIGGER IF EXISTS trigger_name`);
}
```

### Migration Testing

1. **Test against full schema**: Run migrations against `kanaliiga.sql`
2. **Update triggers**: When business rules change, update corresponding triggers
3. **Backward compatibility**: Maintain where possible to support gradual rollouts
4. **Dual-roster impact**: Consider effects on both registration and active rosters

## Performance Optimization

### Indexes

The schema includes comprehensive indexing:

- **Primary keys** on all tables
- **Foreign key indexes** for join performance
- **Unique indexes** for business constraints
- **Composite indexes** for common query patterns
- **Specialized indexes** for trigger performance (e.g., `idx_account_permission_scopes_captain_validation`)

### Query Optimization Tips

1. **Use indexed columns in JOINs**: Follow foreign key relationships
2. **Leverage database functions**: Use `get_account_id_from_steam_id()` for lookups
3. **Consider trigger overhead**: INSERT/UPDATE operations execute triggers
4. **Use appropriate WHERE clauses**: Leverage existing indexes
5. **Monitor performance**: Use Grafana Alloy and OpenTelemetry

### Avoiding N+1 Queries

Use JSON aggregation for one-to-many relationships:

```sql
SELECT
  t.id,
  t.name,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'steam_id', stp.steam_id,
      'nickname', sp.nickname,
      'role', stp.role
    )
  ) AS players
FROM Teams t
JOIN SeasonTeamPlayers stp ON stp.team_id = t.id
JOIN SteamPlayers sp ON sp.steam_id = stp.steam_id
WHERE t.id = ?
GROUP BY t.id, t.name;
```

**Important**: Use `JSONBig` when parsing to preserve Steam IDs (see [backend/models rule](../.cursor/rules/apps/backend/models.md)).

### Data Volume Considerations

- **MapRoundStats**: ~24 rounds per game, indexed by `match_game_id` for fast queries
- **PlayerStats**: One row per player per game, comprehensive CS2 statistics
- **PlayerTrades**: Detailed trade data for advanced analytics
- **AuditLog**: Minimal logging for GDPR compliance only

## Troubleshooting

### Common Issues

#### 1. Captain Permission Errors

**Symptom**: User can't access captain features despite being marked as captain.

**Check**:

```sql
SELECT * FROM SeasonTeamRegistrationPlayers
WHERE season_id = ? AND team_id = ? AND steam_id = ?;
```

**Verify permission assignment**:

```sql
SELECT ar.*, r.role_name
FROM AccountRoles ar
JOIN Roles r ON ar.role_id = r.id
JOIN LinkedAccounts la ON la.account_id = ar.account_id
WHERE la.provider = 'steam' AND la.provider_id = CAST(? AS CHAR);
```

#### 2. CHECK Constraint Violations

**Symptom**: INSERT/UPDATE fails with constraint error message.

**Common constraint violations**:

```sql
-- Email format violation
ERROR: Check constraint 'check_work_email_format' is violated

-- Season date violation
ERROR: Check constraint 'check_season_date_order' is violated
ERROR: Check constraint 'check_signup_dates' is violated

-- Fantasy budget violation
ERROR: Check constraint 'check_budget_non_negative' is violated

-- Player stats violation
ERROR: Check constraint 'check_kills_non_negative' is violated
ERROR: Check constraint 'check_adr_reasonable' is violated

-- Points consistency violation
ERROR: Check constraint 'check_points_breakdown' is violated
```

**Debug**:

```sql
-- Check current values
SELECT work_email FROM Accounts WHERE id = ?;
SELECT start_date, end_date FROM Seasons WHERE id = ?;
SELECT match_date FROM Matches WHERE id = ?;
SELECT budget_remaining FROM FantasyTeams WHERE id = ?;
SELECT points_earned, individual_points, team_points, role_points
FROM FantasyTeamPlayers WHERE id = ?;
```

**Common causes**:

- Invalid email format (missing @ or domain)
- Dates in wrong order (end before start)
- Match date typo (year 2250 instead of 2025)
- Fantasy calculation bug resulting in negative budget
- Points aggregation mismatch

#### 3. Foreign Key Violations

**Symptom**: INSERT fails with foreign key constraint error.

**Debug**:

```sql
-- Check if referenced record exists
SELECT * FROM ReferencedTable WHERE id = ?;

-- Check composite foreign keys
SELECT * FROM SeasonLeagueTeams
WHERE season_id = ? AND team_id = ? AND league_id = ?;
```

**Common causes**:

- Inserting into `MatchTeams` with team not registered in `SeasonLeagueTeams`
- Creating match with non-existent season or league
- Adding player to team before creating `SeasonTeamRegistrations` entry

#### 3. Unique Constraint Violations

**Symptom**: Duplicate entry error.

**Check for duplicates**:

```sql
SELECT steam_id, COUNT(*)
FROM SeasonTeamPlayers
WHERE season_id = ? AND team_id = ?
GROUP BY steam_id
HAVING COUNT(*) > 1;
```

**Common causes**:

- Duplicate Steam IDs in roster
- Multiple teams with same name
- Duplicate external platform IDs for same season

#### 4. Trigger Errors

**Symptom**: Operation fails with trigger-specific error message.

**Debug captain triggers**:

```sql
-- Check if player is actually captain
SELECT * FROM SeasonTeamRegistrationPlayers
WHERE season_id = ? AND team_id = ? AND steam_id = ?
AND (is_captain = 1 OR is_co_captain = 1);

-- Check for account linkage
SELECT * FROM LinkedAccounts
WHERE provider = 'steam' AND provider_id = CAST(? AS CHAR);
```

**Common trigger errors**:

- "Cannot assign captain permissions to non-captain/co-captain player"
- "Only one captain allowed per team per season"
- "Player can only be primary on one team per season"

#### 5. Dual-Roster Confusion

**Symptom**: Player appears in one roster but not the other.

**Compare rosters**:

```sql
SELECT 'Registration' as type, steam_id, is_captain, is_co_captain
FROM SeasonTeamRegistrationPlayers
WHERE season_id = ? AND team_id = ?
UNION ALL
SELECT 'Active' as type, steam_id, is_captain, is_co_captain
FROM SeasonTeamPlayers
WHERE season_id = ? AND team_id = ?;
```

**Understanding**:

- `SeasonTeamRegistrationPlayers`: Original registration data (immutable after "Sortter" runs)
- `SeasonTeamPlayers`: Active rosters for matches (can be modified during season)

### Debugging Queries

#### Check Steam ID to Account ID Mapping

```sql
SELECT get_account_id_from_steam_id(?);
```

#### Check All Permissions for Account

```sql
SELECT
  p.permission_name,
  aps.season_id,
  aps.team_id,
  aps.created_at
FROM AccountPermissionScopes aps
JOIN Permissions p ON aps.permission_id = p.id
WHERE aps.account_id = ?
ORDER BY aps.created_at DESC;
```

#### Check All Roles for Account

```sql
SELECT
  r.role_name,
  ar.game_id,
  ar.created_at
FROM AccountRoles ar
JOIN Roles r ON ar.role_id = r.id
WHERE ar.account_id = ?;
```

#### Validate Match Team Registrations

```sql
-- Find matches with potentially invalid team assignments
SELECT
  mt.match_id,
  mt.team_id,
  m.season_id,
  m.league_id,
  t.name as team_name
FROM MatchTeams mt
JOIN Matches m ON m.id = mt.match_id
JOIN Teams t ON t.id = mt.team_id
LEFT JOIN SeasonLeagueTeams slt
  ON slt.team_id = mt.team_id
  AND slt.season_id = mt.season_id
  AND slt.league_id = mt.league_id
WHERE slt.team_id IS NULL;
```

## Schema Validation

### Running Integrity Checks

```typescript
// Example integrity check service
export const validateDatabaseIntegrity = async () => {
  // Check 1: Match teams are registered
  const invalidMatchTeams = await runQuery(`
    SELECT COUNT(*) as count
    FROM MatchTeams mt
    LEFT JOIN SeasonLeagueTeams slt 
      ON slt.team_id = mt.team_id 
      AND slt.season_id = mt.season_id 
      AND slt.league_id = mt.league_id
    WHERE slt.team_id IS NULL
  `);

  // Check 2: All captains have accounts
  const captainsWithoutAccounts = await runQuery(`
    SELECT COUNT(*) as count
    FROM SeasonTeamRegistrationPlayers strp
    WHERE (strp.is_captain = 1 OR strp.is_co_captain = 1)
    AND NOT EXISTS (
      SELECT 1 FROM LinkedAccounts la 
      WHERE la.provider = 'steam' 
      AND la.provider_id = CAST(strp.steam_id AS CHAR)
    )
  `);

  return {
    invalidMatchTeams: invalidMatchTeams[0].count,
    captainsWithoutAccounts: captainsWithoutAccounts[0].count
  };
};
```

### Data Consistency Checks

Run these periodically (e.g., via cron job):

```sql
-- Check: All MatchTeams have valid season_id and league_id matching Matches
SELECT mt.match_id, mt.season_id as mt_season, m.season_id as m_season
FROM MatchTeams mt
JOIN Matches m ON m.id = mt.match_id
WHERE mt.season_id != m.season_id OR mt.league_id != m.league_id;

-- Check: All players in SeasonTeamPlayers exist in SteamPlayers
SELECT stp.steam_id
FROM SeasonTeamPlayers stp
LEFT JOIN SteamPlayers sp ON sp.steam_id = stp.steam_id
WHERE sp.steam_id IS NULL;

-- Check: Fantasy team budgets are non-negative
SELECT id, fantasy_team_id, budget_remaining
FROM FantasyTeams
WHERE budget_remaining < 0;
```

## Best Practices

### When Querying

1. **Always join through indexed columns**: Follow FK relationships
2. **Use prepared statements**: Prevent SQL injection (already handled by `runQuery`)
3. **Parse JSON with JSONBig**: Preserve Steam IDs when using `JSON_ARRAYAGG`
4. **Specify columns explicitly**: Avoid `SELECT *` in production queries
5. **Consider dual-roster**: Know whether you need registration or active data

### When Inserting/Updating

1. **Use transactions**: Especially when modifying related tables
2. **Let triggers handle permissions**: Don't manually manage captain permissions
3. **Validate registration first**: Check `SeasonLeagueTeams` before creating matches
4. **Preserve Steam IDs**: Use `BIGINT` for Steam ID columns
5. **Handle JSONBig**: Parse with `json-bigint` library when reading

### When Deleting

1. **Understand CASCADE**: Know what will be automatically deleted
2. **Check backups first**: 7-day retention, but be cautious
3. **Consider soft deletes**: Use `discarded_at` or similar for important data
4. **Clean up permissions**: Most are handled by triggers, but verify
5. **Log for audit**: Use `AuditLog` for GDPR-critical deletions

## Reference

- **Schema Source of Truth**: [`apps/backend/dbdump/kanaliiga.sql`](../apps/backend/dbdump/kanaliiga.sql)
- **Visual ERD**: [https://csdb.kanaliiga.fi/](https://csdb.kanaliiga.fi/)
- **Architecture Documentation**: [`README.database.md`](../README.database.md)
- **Migration Files**: [`apps/backend/migrations/`](../apps/backend/migrations/)
- **Type Definitions**: [`packages/types/src/db/`](../packages/types/src/db/)
