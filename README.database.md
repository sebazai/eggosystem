# Database Schema and Operations

This document provides comprehensive information about the Kanaliiga database schema, including relationships, triggers, functions, and procedures.

## Database Reference

**Primary Schema File**: `apps/backend/dbdump/kanaliiga.sql`

This file contains the complete database schema including:

- Table structures and relationships
- Triggers and their business logic
- Functions and procedures
- Indexes and constraints
- Foreign key relationships

## Key Database Features

### Functions

#### `get_account_id_from_steam_id(steam_id_param BIGINT)`

Returns the account ID for a given Steam ID.

```sql
SELECT get_account_id_from_steam_id(76561198000000000);
```

### Triggers

#### Captain Permission Validation

**Tables**: `AccountPermissionScopes`, `SeasonTeamRegistrationPlayers`

**Purpose**: Ensures captain permissions are only assigned to actual captains/co-captains.

**Triggers**:

- `validate_captain_permission_on_insert`
- `validate_captain_permission_on_update`

**Business Logic**: Prevents assignment of captain-related permissions (`edit-registration`, `manage-team`, `captain-permissions`) to non-captain players.

#### Captain Permission Management

**Table**: `SeasonTeamRegistrationPlayers`

**Purpose**: Automatically manages captain permissions when captain status changes.

**Triggers**:

- `add_captain_permissions_on_insert` - Adds permissions when captain status is set
- `add_captain_permissions_on_update` - Adds permissions when captain status is added
- `cleanup_captain_permissions_on_delete` - Removes permissions when captain is removed
- `cleanup_captain_permissions_on_update` - Removes permissions when captain status is removed

#### Unique Constraints

**Table**: `SeasonTeamRegistrationPlayers`

**Triggers**:

- `unique_captain_per_team_season` - Ensures only one captain per team per season
- `unique_co_captain_per_team_season` - Ensures only one co-captain per team per season

#### Primary Player Validation

**Table**: `SeasonTeamPlayers`

**Triggers**:

- `before_insert_primary_check` - Prevents players from being primary on multiple teams
- `before_update_primary_check` - Prevents players from being primary on multiple teams

#### Team Registration Validation

**Table**: `SeasonTeamRegistrations`

**Triggers**:

- `before_insert_team_registration` - Prevents duplicate team registrations
- `before_update_team_registration` - Prevents duplicate team registrations
- `before_insert_unique_external_platform` - Ensures unique external platform IDs
- `before_update_unique_external_platform` - Ensures unique external platform IDs
- `cleanup_captain_permissions_on_registration_delete` - Cleans up permissions when registration is deleted

#### Player Approval Validation

**Table**: `SeasonPlayerApprovals`

**Triggers**:

- `check_team_or_organization` - Ensures either team_id or organization_id is provided
- `check_team_or_organization_update` - Ensures either team_id or organization_id is provided on update

## Database Relationships

### Core Entities

#### Accounts and Authentication

- `Accounts` - User accounts with work email and profile information
- `LinkedAccounts` - Links accounts to external providers (Steam, Discord)
- `SteamPlayers` - Steam player information linked to accounts

#### Teams and Organizations

- `Teams` - Team information with organization association
- `Organizations` - Organization/company information
- `TeamRosters` - Team membership (legacy)

#### Seasons and Leagues

- `Seasons` - Tournament seasons with game and organizer information
- `Leagues` - League/tier information
- `SeasonLeagues` - Links seasons to leagues with tier information
- `SeasonLeagueTeams` - Team participation in season leagues

#### Player Management

- `SeasonTeamPlayers` - Active team rosters for matches
- `SeasonTeamRegistrationPlayers` - Team registration rosters
- `SeasonPlayerApprovals` - Player approval workflow
- `SeasonPlayerRanks` - Player ranking information

#### Matches and Games

- `Matches` - Match information with season/league context
- `MatchGames` - Individual games within matches
- `MatchTeams` - Teams participating in matches
- `PlayerStats` - Detailed player statistics per game
- `TeamGameScores` - Team scores per game

#### Permissions and Roles

- `Roles` - System roles (captain, admin, etc.)
- `Permissions` - Individual permissions
- `RolePermissions` - Role-permission mappings
- `AccountRoles` - User role assignments
- `AccountPermissionScopes` - Scoped permissions (season/team specific)

## Important Constraints

### Foreign Key Relationships

All foreign key constraints are defined in the schema with appropriate CASCADE behaviors:

- Most relationships use `ON DELETE CASCADE` for data integrity
- Some use `ON DELETE SET NULL` for optional references
- Account references typically use `ON DELETE CASCADE`

### Unique Constraints

- Steam IDs are unique across the system
- Team names are unique
- Organization codes are unique
- External platform IDs are unique per season
- One captain and one co-captain per team per season

### Business Rules Enforced by Triggers

1. **Captain Permissions**: Only actual captains can have captain permissions
2. **Primary Players**: Players can only be primary on one team per season
3. **Team Registration**: Teams can only register once per season
4. **External IDs**: External platform IDs must be unique per season
5. **Player Approvals**: Must specify either team or organization

## Database Operations

### Common Queries

#### Get Player Account Information

```sql
SELECT a.*, sp.steam_id, sp.nickname, sp.faceit_id
FROM Accounts a
JOIN LinkedAccounts la ON a.id = la.account_id
JOIN SteamPlayers sp ON la.provider_id = CAST(sp.steam_id AS CHAR)
WHERE la.provider = 'steam' AND sp.steam_id = ?;
```

#### Get Team Captain Information

```sql
SELECT sp.steam_id, sp.nickname, strp.is_captain, strp.is_co_captain
FROM SeasonTeamRegistrationPlayers strp
JOIN SteamPlayers sp ON strp.steam_id = sp.steam_id
WHERE strp.season_id = ? AND strp.team_id = ?
AND (strp.is_captain = 1 OR strp.is_co_captain = 1);
```

#### Get Player Permissions

```sql
SELECT p.permission_name, aps.season_id, aps.team_id
FROM AccountPermissionScopes aps
JOIN Permissions p ON aps.permission_id = p.id
WHERE aps.account_id = ?;
```

### Migration Considerations

When writing migrations or queries:

1. **Always check triggers**: Many business rules are enforced by triggers
2. **Respect foreign key constraints**: Use proper CASCADE behaviors
3. **Consider unique constraints**: Especially for Steam IDs and external platform IDs
4. **Account linking**: Use the `get_account_id_from_steam_id` function for Steam ID lookups
5. **Permission management**: Captain permissions are automatically managed by triggers

### Performance Considerations

#### Indexes

The schema includes comprehensive indexing:

- Primary keys on all tables
- Foreign key indexes for join performance
- Unique indexes for business constraints
- Composite indexes for common query patterns

#### Query Optimization

- Use proper JOIN conditions with indexed columns
- Leverage the `get_account_id_from_steam_id` function for Steam ID lookups
- Consider the impact of triggers on INSERT/UPDATE operations
- Use appropriate WHERE clauses to leverage indexes

## Schema Evolution

### Migration Strategy

- Use Knex.js migrations for schema changes
- Test migrations against the full schema including triggers
- Update triggers when business rules change
- Maintain backward compatibility where possible

### Schema Validation

- The `kanaliiga.sql` file serves as the source of truth
- All migrations should be tested against this schema
- Triggers and functions should be version controlled
- Business rule changes require trigger updates

## Troubleshooting

### Common Issues

1. **Captain Permission Errors**: Check if the player is actually a captain in `SeasonTeamRegistrationPlayers`
2. **Foreign Key Violations**: Ensure referenced records exist before inserting
3. **Unique Constraint Violations**: Check for duplicate Steam IDs or external platform IDs
4. **Trigger Errors**: Review trigger logic for business rule violations

### Debugging Queries

```sql
-- Check captain status
SELECT * FROM SeasonTeamRegistrationPlayers
WHERE season_id = ? AND team_id = ? AND steam_id = ?;

-- Check account linking
SELECT * FROM LinkedAccounts
WHERE provider = 'steam' AND provider_id = CAST(? AS CHAR);

-- Check permissions
SELECT p.permission_name, aps.*
FROM AccountPermissionScopes aps
JOIN Permissions p ON aps.permission_id = p.id
WHERE aps.account_id = ?;
```
