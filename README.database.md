# Database Schema Documentation

This document explains the Kanaliiga database architecture and design decisions. The database supports a corporate esports league with tournament management, player ranking, and multi-platform integration.

## Getting Started

**Schema File**: The complete database schema is in `apps/backend/dbdump/kanaliiga.sql`

**Visual Diagram**: [https://csdb.kanaliiga.fi/](https://csdb.kanaliiga.fi/) - Interactive entity-relationship diagram showing all tables, relationships, and constraints

**For Practical Queries**: See the [Database Operations Guide](docs/database-operations.md) for common queries, troubleshooting, and migration patterns

## Key Design Decisions

### Why Two Roster Tables?

The system uses a **dual-roster architecture** that separates registration from competition:

1. **`SeasonTeamRegistrationPlayers`** - Where teams initially register their players
2. **`SeasonTeamPlayers`** - The active roster used during matches

**Why?** This separation allows the "Sortter" algorithm to process registrations and create balanced leagues, then copy final rosters to the competition table. Active rosters can be modified during the season without affecting the original registration data.

### Why Steam ID Everywhere?

Steam ID is used as the primary player identifier throughout the system:

- Steam is how players authenticate
- Creates a direct link between login and player identity
- Avoids maintaining separate internal ID mappings
- The `get_account_id_from_steam_id()` function bridges to the internal account system when needed

### Why Duplicate Data in MatchTeams?

The `MatchTeams` table includes `season_id` and `league_id` even though they're already in the `Matches` table. This intentional duplication enables a critical database constraint:

```sql
FOREIGN KEY (season_id, team_id, league_id)
  REFERENCES SeasonLeagueTeams(season_id, team_id, league_id)
```

**What this prevents:** Teams can only participate in matches for seasons/leagues they're actually registered in. The database will reject invalid match assignments even if application code has bugs.

### Why Business Logic in Triggers?

Many business rules are enforced by database triggers rather than application code:

- **Automatic**: Captain role and permission grants are managed when captain/co-captain status changes
- **Reliable**: Works regardless of how data is modified (app, admin tools, direct DB access)
- **Simple**: Reduces application code complexity
- **Safe**: Captain-scoped permissions are narrow, so the blast radius is minimal

## Data Validation

The database enforces data quality at multiple levels:

- **Email Format**: Work emails must be valid
- **Date Logic**: Season and match dates must be in the correct order
- **Budget Limits**: Fantasy team budgets can't be negative
- **Stats Ranges**: Player statistics must be reasonable (kills/deaths/assists ≥ 0, ADR between 0-500)
- **Points Math**: Fantasy points must add up correctly

These checks catch data quality issues even if application validation is bypassed. See the [Database Operations Guide](docs/database-operations.md) for troubleshooting constraint violations.

## Database Functions and Triggers

### Functions

**`get_account_id_from_steam_id(steam_id)`** - Converts Steam IDs to internal account IDs. Used by triggers that manage permissions, since the backend works with Steam IDs but the permission system uses account IDs.

### Triggers Overview

The database uses triggers to automatically enforce business rules. The captain-related triggers were refactored in migration `20251227000000_refactor_captain_permissions_architecture.ts` to split responsibilities between the two roster tables:

**Registration permissions (`SeasonTeamRegistrationPlayers`)** - `add_captain_permissions_on_insert` / `add_captain_permissions_on_update` grant the scoped `edit-registration` permission (in `AccountPermissionScopes`) when a player is flagged as captain or co-captain. The `cleanup_captain_permissions_on_update` / `_on_delete` / `_on_registration_delete` triggers revoke it. `validate_captain_permission_on_insert` / `_on_update` on `AccountPermissionScopes` reject captain-scoped permissions for accounts that are not actually captain or co-captain for that season/team.

**Captain role (`SeasonTeamPlayers`)** - `add_captain_role_on_seasonteamplayers_insert` / `_update` grant the `captain` role (in `AccountRoles`) once a player is confirmed on the live roster. `cleanup_captain_role_on_seasonteamplayers_update` / `_delete` remove the role when the player has no remaining captain or co-captain assignments anywhere in `SeasonTeamPlayers`. This table is the source of truth for the captain role after Sortter runs.

**Team hierarchy** - `unique_captain_per_team_season` / `unique_co_captain_per_team_season` (plus the UPDATE variants) enforce at most one captain and one co-captain per team per season on `SeasonTeamRegistrationPlayers`.

**Primary players** - `before_insert_primary_check` / `before_update_primary_check` on `SeasonTeamPlayers` reject a primary-role insert or update when the same `steam_id` is already a non-discarded primary in another team in the same season (soft-deleted rows with `discarded_at IS NOT NULL` are ignored).

**Team registration** - `before_insert_team_registration` / `before_update_team_registration` prevent duplicate team registrations, and `before_insert_unique_external_platform` / `before_update_unique_external_platform` keep external platform IDs (FaceIT, Esportal) unique per season.

**Player approvals** - `check_team_or_organization` / `check_team_or_organization_update` require every `SeasonPlayerApprovals` row to reference a team, an organization, or both.

**`updated_at` maintenance** - A family of `update_*_updated_at` triggers (generated in `20251011093124_updated_at_created_at.ts` plus a few table-specific migrations) keeps the `updated_at` column current on rows that carry one.

All triggers are defined in `apps/backend/migrations/` and executed by MariaDB regardless of how the data is modified.

## Database Structure

### Accounts and Authentication

- **`Accounts`** - User accounts with work email and profile info
- **`LinkedAccounts`** - Links accounts to Steam, Discord, etc.
- **`SteamPlayers`** - Steam player information
- **`UserPolicyAcceptances`** - GDPR compliance tracking

Steam ID is the primary identity, with an internal account system for permissions and compliance.

### Teams and Organizations

- **`Teams`** - Team information (can optionally belong to an organization)
- **`Organizations`** - Company/organization information
- **`TeamRosters`** - Future feature for persistent rosters across seasons

Organization membership is optional to support both corporate teams and pick-up teams.

### Seasons and Leagues

- **`Seasons`** - Tournament seasons
- **`Leagues`** - League tiers/divisions
- **`SeasonLeagues`** - Links seasons to leagues
- **`SeasonLeagueTeams`** - Which teams participate in which season/league
- **`SeasonLeagueExternalIds`** - Maps external platform IDs (FaceIT, etc.) to internal structure

The system is season-centric with support for multiple external tournament platforms.

### Player Management

- **`SeasonTeamRegistrationPlayers`** - Initial team registrations
- **`SeasonTeamPlayers`** - Active rosters during competition
- **`SeasonPlayerApprovals`** - Employment verification for players without work emails
- **`SeasonPlayerRanks`** - Player rankings from multiple platforms (includes per-season `kana_elo` snapshot at registration/Sortter time)
- **`SteamPlayerKanaElo`** - Live global kana_elo from CSRankker bulk recalculation

**Kana elo dual-table contract:** `SteamPlayerKanaElo` holds the current live rating (written by bulk CSRankker recalc). `SeasonPlayerRanks.kana_elo` is the per-season snapshot used by Sortter and historical views. API reads prefer `SteamPlayerKanaElo` and fall back to the latest non-null `SeasonPlayerRanks.kana_elo`. Bulk recalc updates both tables for the player's latest season row when one exists.

Uses a dual-roster system: registration → sorting → competition.

### Matches and Games

- **`Matches`** - Match information (can be standalone or part of a season)
- **`MatchGames`** - Individual games within a match (BO1, BO3, BO5)
- **`MatchTeams`** - Which teams are in the match
- **`PlayerStats`** - Detailed CS2 stats per game (from demo parsing)
- **`TeamGameScores`** - Team scores per game
- **`MapRoundStats`** - Round-by-round CS2 statistics
- **`PlayerTrades`** - Trade statistics for analytics
- **`MatchGameClips`** - Clip metadata from Allstar partnership
- **`MatchTeamMapVetoes`** - Map veto data from FaceIT

Three-level hierarchy: Matches → MatchGames → PlayerStats.

### Permissions and Roles

- **`Roles`** - System roles (captain, admin, etc.)
- **`Permissions`** - Individual permissions
- **`RolePermissions`** - Which permissions each role has
- **`AccountRoles`** - User role assignments
- **`AccountPermissionScopes`** - Scoped permissions (season/team specific)

Captain permissions are automatically managed by triggers.

### External Integrations

- **`FaceitWebhooks`** - FaceIT webhook processing
- **`KanahautomoRegistrations`** - Discord bot role management
- **`Reservations`** - Stream slot reservations for casters
- **`AccountCasterUrls`** - Caster streaming platform URLs

## Data Integrity Rules

### Foreign Keys

Most relationships use `ON DELETE CASCADE` to maintain data integrity. Some optional references use `ON DELETE SET NULL` (like account references in audit logs).

**Safety**: Daily backups with 7-day retention protect against accidental deletions.

### Composite Foreign Keys

The `MatchTeams` table uses a composite foreign key to ensure teams can only participate in matches for seasons/leagues they're registered in:

```sql
FOREIGN KEY (season_id, team_id, league_id)
  REFERENCES SeasonLeagueTeams(season_id, team_id, league_id)
```

This prevents invalid scenarios like assigning Team A to a match in Season 2 when they're only registered for Season 1.

### Unique Constraints

- Steam IDs (primary identity)
- Team names
- Organization codes
- External platform IDs per season
- One captain and one co-captain per team per season
- Work emails (for corporate verification)

### Business Rules (Enforced by Triggers)

1. Only actual captains or co-captains can hold captain-scoped permissions in `AccountPermissionScopes`
2. The `captain` role is granted and revoked automatically from the live `SeasonTeamPlayers` roster
3. Players can only be primary (non-discarded) on one team per season
4. Teams can only register once per season
5. External platform IDs must be unique per season
6. Player approvals must specify at least one of team or organization
7. At most one captain and one co-captain per team per season

### Error Messages

Constraint violations are returned to the frontend in RFC 7807 Problem Details format, providing clear error messages to users.

## Future Improvements

- **Standalone Matches**: Support for exhibition matches outside of seasons
- **Persistent Rosters**: Cross-season roster management (TeamRosters table)
- **Multi-Platform**: Support for more external platforms beyond FaceIT
- **Performance**: Continuous monitoring and optimization

## Working with the Database

**Schema Source**: `apps/backend/dbdump/kanaliiga.sql` is the source of truth

**Migrations**: Use Knex.js for all schema changes. Test against the full schema including triggers.

**Related Documentation**:

- [Database Operations Guide](docs/database-operations.md) - Common queries and troubleshooting
- [Migration Files](apps/backend/migrations/) - Historical schema changes
- [Type Definitions](packages/types/src/db/) - TypeScript interfaces
- [Visual ERD](https://csdb.kanaliiga.fi/) - Interactive diagram
