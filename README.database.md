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

- **Automatic**: Captain permissions are managed automatically when captain status changes
- **Reliable**: Works regardless of how data is modified (app, admin tools, direct DB access)
- **Simple**: Reduces application code complexity
- **Safe**: Captain permissions are low-privilege, so the risk is minimal

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

The database uses triggers to automatically enforce business rules:

**Captain Permissions** - Automatically adds/removes captain permissions when someone becomes or stops being a captain. Also prevents non-captains from having captain permissions.

**Team Hierarchy** - Ensures only one captain and one co-captain per team per season.

**Primary Players** - Prevents players from being primary roster members on multiple teams in the same season.

**Team Registration** - Prevents duplicate registrations and ensures external platform IDs (FaceIT, Esportal) are unique per season.

**Player Approvals** - Ensures player approval records specify either a team or organization (for employment verification workflow).

All triggers are defined in the schema file and work automatically regardless of how data is modified.

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
- **`SeasonPlayerRanks`** - Player rankings from multiple platforms
- **`SteamPlayerKanaElo`** - Global ELO system (not season-specific)

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

1. Only actual captains can have captain permissions
2. Players can only be primary on one team per season
3. Teams can only register once per season
4. External platform IDs must be unique per season
5. Player approvals must specify either team or organization
6. Permissions are automatically cleaned up when captain status changes

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
