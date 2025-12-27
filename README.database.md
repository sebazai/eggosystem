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

**Visual Database Architecture**: [https://csdb.kanaliiga.fi/](https://csdb.kanaliiga.fi/)

Interactive entity-relationship diagram showing:

- All tables and their columns with data types
- Foreign key relationships and constraints
- Visual representation of the database architecture
- Navigable diagram with pan and zoom functionality

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

### Intentional Denormalization for Data Integrity

The database uses **controlled denormalization** in specific cases where database-level constraints provide significant integrity benefits:

#### MatchTeams Table

**Structure:**

```sql
CREATE TABLE MatchTeams (
  match_id INT UNSIGNED,
  team_id INT UNSIGNED,
  season_id INT UNSIGNED,  -- Redundant with Matches.season_id
  league_id INT UNSIGNED,  -- Redundant with Matches.league_id
  PRIMARY KEY (match_id, team_id),
  FOREIGN KEY (season_id, team_id, league_id)
    REFERENCES SeasonLeagueTeams(season_id, team_id, league_id)
);
```

**Why Denormalize:**

The `season_id` and `league_id` columns duplicate data from the `Matches` table, but they enable a **critical composite foreign key constraint** to `SeasonLeagueTeams` that ensures:

- Teams can only participate in matches for seasons/leagues they're registered in
- Database-level validation prevents invalid match assignments
- Protection works even if application code has bugs
- Fail-fast behavior at the database layer

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

#### Composite Foreign Keys for Data Integrity

Several tables use composite foreign keys that span multiple columns to enforce complex business rules:

**MatchTeams → SeasonLeagueTeams:**

```sql
FOREIGN KEY (season_id, team_id, league_id)
REFERENCES SeasonLeagueTeams(season_id, team_id, league_id)
```

**Purpose**: Ensures teams can only participate in matches for seasons/leagues they are registered in.

**Why Important**: Prevents invalid scenarios like:

- Team A registered for Season 1, League 1
- Match created in Season 2, League 2 with Team A
- Without this FK, database would accept invalid assignment
- With this FK, database rejects at INSERT time

**Note**: While `season_id` and `league_id` in `MatchTeams` are redundant with the `Matches` table, this denormalization is intentional to enable this critical validation constraint. See "Intentional Denormalization" section above.

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

## Schema Evolution & Future Considerations

### Planned Improvements

- **Flexible Match System**: Support nullable season_id/league_id for standalone/exhibition matches
- **TeamRosters**: Persistent roster management across seasons (currently unused table)
- **Multi-Platform Support**: Ongoing work to support multiple external platforms beyond FaceIT
- **Performance Optimization**: Continuous monitoring with Grafana Alloy and OpenTelemetry

### Schema Governance

- The `kanaliiga.sql` file serves as the source of truth
- All migrations must be tested against the full schema including triggers
- Triggers and functions are version controlled
- Business rule changes require corresponding trigger updates
- Use Knex.js for all schema migrations

## Operational Documentation

For practical information on working with the database, see:

- **[Database Operations Guide](docs/database-operations.md)**: Common queries, troubleshooting, performance optimization
- **[Migration Files](apps/backend/migrations/)**: Historical schema changes
- **[Type Definitions](packages/types/src/db/)**: TypeScript interfaces for database tables
- **[Visual ERD](https://csdb.kanaliiga.fi/)**: Interactive entity-relationship diagram
