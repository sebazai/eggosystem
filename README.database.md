# Database Schema and Operations

This document provides comprehensive information about the Kanaliiga database schema, including relationships, triggers, functions, and procedures. The database is designed to support a corporate esports league with sophisticated tournament management, player ranking, and multi-platform integration.

## Database Reference

**Primary Schema File**: `apps/backend/dbdump/kanaliiga.sql`

This file contains the complete database schema including:

- Table structures and relationships
- Triggers and their business logic
- Functions and procedures
- Indexes and constraints
- Foreign key relationships

## Core Design Principles

### Dual-Roster Architecture

The system implements a sophisticated **registration-to-competition pipeline**:

1. **Registration Phase**: Teams register players in `SeasonTeamRegistrationPlayers`
2. **Sorting Phase**: "Sortter" algorithm processes registrations to create balanced leagues
3. **Competition Phase**: Final rosters copied to `SeasonTeamPlayers` for active tournament play
4. **Runtime Flexibility**: Active rosters can be modified without affecting original registration data

### Steam ID as Primary Identity

Steam ID is the primary player identifier throughout the system because:

- Steam is the primary authentication method
- Creates natural 1:1 mapping between authentication and player identity
- Eliminates complexity of maintaining separate internal IDs
- Database function `get_account_id_from_steam_id` bridges to internal account system

### Business Logic in Database

Critical business rules are enforced via database triggers for:

- **Data Consistency**: Automatic permission management
- **Simplicity**: Reduces application code complexity
- **Reliability**: Works regardless of how data is modified
- **Low Risk**: Captain permissions don't have high security implications

## Key Database Features

### Functions

#### `get_account_id_from_steam_id(steam_id_param BIGINT)`

**Purpose**: Bridges between Steam IDs (used in backend) and internal account IDs (used in permission system).

**Usage**: Essential for triggers that need to convert Steam IDs to account IDs for permission management.

```sql
SELECT get_account_id_from_steam_id(76561198000000000);
```

**Why Database Function**: Triggers need account_id for permission management, but backend primarily works with steam_id from authentication and match data.

### Triggers

#### Captain Permission Validation

**Tables**: `AccountPermissionScopes`, `SeasonTeamRegistrationPlayers`

**Purpose**: Ensures captain permissions are only assigned to actual captains/co-captains.

**Triggers**:

- `validate_captain_permission_on_insert`
- `validate_captain_permission_on_update`

**Business Logic**: Prevents assignment of captain-related permissions (`edit-registration`, `manage-team`, `captain-permissions`) to non-captain players.

**Why Database-Level**: Ensures data consistency regardless of how captain status is modified (application, admin tools, direct DB changes).

#### Captain Permission Management

**Table**: `SeasonTeamRegistrationPlayers`

**Purpose**: Automatically manages captain permissions when captain status changes.

**Triggers**:

- `add_captain_permissions_on_insert` - Adds permissions when captain status is set
- `add_captain_permissions_on_update` - Adds permissions when captain status is added
- `cleanup_captain_permissions_on_delete` - Removes permissions when captain is removed
- `cleanup_captain_permissions_on_update` - Removes permissions when captain status is removed

**Benefits**:

- Automatic permission synchronization
- Reduces application code complexity
- Works for all data modification methods
- Low security risk (captain permissions are not high-privilege)

#### Unique Constraints

**Table**: `SeasonTeamRegistrationPlayers`

**Triggers**:

- `unique_captain_per_team_season` - Ensures only one captain per team per season
- `unique_co_captain_per_team_season` - Ensures only one co-captain per team per season

**Business Logic**: Maintains clear team hierarchy and prevents permission conflicts.

#### Primary Player Validation

**Table**: `SeasonTeamPlayers`

**Triggers**:

- `before_insert_primary_check` - Prevents players from being primary on multiple teams
- `before_update_primary_check` - Prevents players from being primary on multiple teams

**Business Logic**: Ensures players can only be primary roster members on one team per season, preventing conflicts in match participation.

#### Team Registration Validation

**Table**: `SeasonTeamRegistrations`

**Triggers**:

- `before_insert_team_registration` - Prevents duplicate team registrations
- `before_update_team_registration` - Prevents duplicate team registrations
- `before_insert_unique_external_platform` - Ensures unique external platform IDs
- `before_update_unique_external_platform` - Ensures unique external platform IDs
- `cleanup_captain_permissions_on_registration_delete` - Cleans up permissions when registration is deleted

**Business Logic**:

- Prevents teams from registering multiple times per season
- Ensures external platform IDs (FaceIT, Esportal, etc.) are unique per season
- Maintains data integrity when registrations are deleted

#### Player Approval Validation

**Table**: `SeasonPlayerApprovals`

**Triggers**:

- `check_team_or_organization` - Ensures either team_id or organization_id is provided
- `check_team_or_organization_update` - Ensures either team_id or organization_id is provided on update

**Business Logic**: Supports flexible approval workflow where players without work emails need employment verification at either organization level (unknown team assignment) or team level (known team assignment).

## Database Relationships

### Core Entities

#### Accounts and Authentication

- `Accounts` - User accounts with work email and profile information
- `LinkedAccounts` - Links accounts to external providers (Steam, Discord)
- `SteamPlayers` - Steam player information linked to accounts
- `UserPolicyAcceptances` - GDPR compliance tracking for privacy policy consent

**Key Design**: Steam ID is primary identity, with internal account system for permissions and GDPR compliance.

#### Teams and Organizations

- `Teams` - Team information with optional organization association
- `Organizations` - Organization/company information
- `TeamRosters` - Future feature for persistent roster management across seasons

**Key Design**: Organization membership is optional to support both corporate teams and scramble/pick-up teams.

#### Seasons and Leagues

- `Seasons` - Tournament seasons with game and organizer information
- `Leagues` - League/tier information
- `SeasonLeagues` - Links seasons to leagues with tier information
- `SeasonLeagueTeams` - Team participation in season leagues
- `SeasonLeagueExternalIds` - Maps external platform IDs to internal league structure

**Key Design**: Season-centric architecture with multi-platform support for external tournament platforms.

#### Player Management

- `SeasonTeamPlayers` - Active team rosters for matches (competition phase)
- `SeasonTeamRegistrationPlayers` - Team registration rosters (registration phase)
- `SeasonPlayerApprovals` - Employment verification workflow for players without work emails
- `SeasonPlayerRanks` - Player ranking information from multiple platforms
- `SteamPlayerKanaElo` - Global, persistent ELO system (not season-specific)

**Key Design**: Dual-roster system separates registration from competition, with sophisticated ranking integration.

#### Matches and Games

- `Matches` - Match information with season/league context (nullable for standalone matches)
- `MatchGames` - Individual games within matches (BO1, BO3, BO5 support)
- `MatchTeams` - Teams participating in matches
- `PlayerStats` - Detailed CS2 player statistics per game (parsed from demos)
- `TeamGameScores` - Team scores per game
- `MapRoundStats` - Round-by-round statistics for CS2 matches
- `PlayerTrades` - Detailed trade statistics for advanced analytics
- `MatchGameClips` - Clip metadata from Allstar partnership
- `MatchTeamMapVetoes` - Map veto data from FaceIT integration

**Key Design**: Three-level hierarchy (Matches → MatchGames → PlayerStats) with comprehensive CS2-specific analytics.

#### Permissions and Roles

- `Roles` - System roles (captain, admin, etc.)
- `Permissions` - Individual permissions
- `RolePermissions` - Role-permission mappings
- `AccountRoles` - User role assignments
- `AccountPermissionScopes` - Scoped permissions (season/team specific)

**Key Design**: Sophisticated permission system with automatic captain permission management via triggers.

#### External Integrations

- `FaceitWebhooks` - Webhook processing for FaceIT integration
- `KanahautomoRegistrations` - Discord bot service for role management
- `Reservations` - Stream slot reservations for casters
- `AccountCasterUrls` - Multiple streaming platform URLs for casters

## Important Constraints

### Foreign Key Relationships

All foreign key constraints are defined in the schema with appropriate CASCADE behaviors:

- Most relationships use `ON DELETE CASCADE` for data integrity
- Some use `ON DELETE SET NULL` for optional references (e.g., account references in audit logs)
- Account references typically use `ON DELETE CASCADE`

**Safety**: Daily backups with 7-day retention provide protection against accidental cascade deletions.

### Unique Constraints

- Steam IDs are unique across the system (primary identity)
- Team names are unique
- Organization codes are unique
- External platform IDs are unique per season
- One captain and one co-captain per team per season
- Work emails are unique (for corporate verification)

### Business Rules Enforced by Triggers

1. **Captain Permissions**: Only actual captains can have captain permissions
2. **Primary Players**: Players can only be primary on one team per season
3. **Team Registration**: Teams can only register once per season
4. **External IDs**: External platform IDs must be unique per season
5. **Player Approvals**: Must specify either team or organization
6. **Permission Cleanup**: Automatic cleanup when captain status changes or registrations are deleted

### Error Handling

Database constraint violations are propagated to the frontend via RFC 7807 Problem Details format through Express error handling middleware, ensuring user-friendly error messages.

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

**Usage**: Core query for player authentication and profile data.

#### Get Team Captain Information

```sql
SELECT sp.steam_id, sp.nickname, strp.is_captain, strp.is_co_captain
FROM SeasonTeamRegistrationPlayers strp
JOIN SteamPlayers sp ON strp.steam_id = sp.steam_id
WHERE strp.season_id = ? AND strp.team_id = ?
AND (strp.is_captain = 1 OR strp.is_co_captain = 1);
```

**Usage**: Used for permission validation and team management.

#### Get Player Permissions

```sql
SELECT p.permission_name, aps.season_id, aps.team_id
FROM AccountPermissionScopes aps
JOIN Permissions p ON aps.permission_id = p.id
WHERE aps.account_id = ?;
```

**Usage**: Authorization checks for API endpoints and UI features.

#### Get Active Team Roster

```sql
SELECT sp.steam_id, sp.nickname, stp.role, stp.is_captain, stp.is_co_captain
FROM SeasonTeamPlayers stp
JOIN SteamPlayers sp ON stp.steam_id = sp.steam_id
WHERE stp.season_id = ? AND stp.team_id = ?;
```

**Usage**: Display current team roster for matches (not registration roster).

### Migration Considerations

When writing migrations or queries:

1. **Always check triggers**: Many business rules are enforced by triggers
2. **Respect foreign key constraints**: Use proper CASCADE behaviors
3. **Consider unique constraints**: Especially for Steam IDs and external platform IDs
4. **Account linking**: Use the `get_account_id_from_steam_id` function for Steam ID lookups
5. **Permission management**: Captain permissions are automatically managed by triggers
6. **Dual-roster system**: Understand the difference between registration and active rosters
7. **Steam ID handling**: Steam ID is primary identity throughout the system

### Performance Considerations

#### Indexes

The schema includes comprehensive indexing:

- Primary keys on all tables
- Foreign key indexes for join performance
- Unique indexes for business constraints
- Composite indexes for common query patterns
- Specialized indexes for trigger performance (e.g., `idx_account_permission_scopes_captain_validation`)

#### Query Optimization

- Use proper JOIN conditions with indexed columns
- Leverage the `get_account_id_from_steam_id` function for Steam ID lookups
- Consider the impact of triggers on INSERT/UPDATE operations
- Use appropriate WHERE clauses to leverage indexes
- Monitor performance with Grafana Alloy and OpenTelemetry

#### Data Volume Considerations

- **MapRoundStats**: ~24 rounds per game, indexed by game_id for fast queries
- **PlayerStats**: One row per player per game, comprehensive CS2 statistics
- **PlayerTrades**: Detailed trade data for advanced analytics
- **AuditLog**: Minimal logging for GDPR compliance only

## Schema Evolution

### Migration Strategy

- Use Knex.js migrations for schema changes
- Test migrations against the full schema including triggers
- Update triggers when business rules change
- Maintain backward compatibility where possible
- Consider impact on dual-roster system when modifying player tables

### Schema Validation

- The `kanaliiga.sql` file serves as the source of truth
- All migrations should be tested against this schema
- Triggers and functions should be version controlled
- Business rule changes require trigger updates

### Future Considerations

- **Flexible Match System**: Plans to support nullable season_id/league_id for standalone matches
- **TeamRosters**: Future feature for persistent roster management across seasons
- **Multi-Platform Support**: Ongoing work to support multiple external platforms beyond FaceIT

## Troubleshooting

### Common Issues

1. **Captain Permission Errors**: Check if the player is actually a captain in `SeasonTeamRegistrationPlayers`
2. **Foreign Key Violations**: Ensure referenced records exist before inserting
3. **Unique Constraint Violations**: Check for duplicate Steam IDs or external platform IDs
4. **Trigger Errors**: Review trigger logic for business rule violations
5. **Dual-Roster Confusion**: Ensure you're querying the correct roster table (registration vs active)

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

-- Check Steam ID to Account ID mapping
SELECT get_account_id_from_steam_id(?);

-- Compare registration vs active rosters
SELECT 'Registration' as type, steam_id, is_captain, is_co_captain
FROM SeasonTeamRegistrationPlayers
WHERE season_id = ? AND team_id = ?
UNION ALL
SELECT 'Active' as type, steam_id, is_captain, is_co_captain
FROM SeasonTeamPlayers
WHERE season_id = ? AND team_id = ?;
```
