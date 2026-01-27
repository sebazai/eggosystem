import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Accounts and Authentication
  await knex.raw(
    `ALTER TABLE Accounts COMMENT = 'User accounts with work email and profile info'`
  );
  await knex.raw(
    `ALTER TABLE LinkedAccounts COMMENT = 'Links accounts to external providers (Steam, Discord, etc.)'`
  );
  await knex.raw(
    `ALTER TABLE SteamPlayers COMMENT = 'Steam player information linked to accounts'`
  );
  await knex.raw(
    `ALTER TABLE UserPolicyAcceptances COMMENT = 'GDPR compliance tracking for privacy policy consent'`
  );

  // Teams and Organizations
  await knex.raw(
    `ALTER TABLE Teams COMMENT = 'Team information (can optionally belong to an organization)'`
  );
  await knex.raw(
    `ALTER TABLE Organizations COMMENT = 'Company/organization information'`
  );
  await knex.raw(
    `ALTER TABLE TeamRosters COMMENT = 'Future feature for persistent roster management across seasons'`
  );

  // Seasons and Leagues
  await knex.raw(
    `ALTER TABLE Seasons COMMENT = 'Tournament seasons with game and organizer information'`
  );
  await knex.raw(`ALTER TABLE Leagues COMMENT = 'League tiers/divisions'`);
  await knex.raw(
    `ALTER TABLE SeasonLeagues COMMENT = 'Links seasons to leagues with tier information'`
  );
  await knex.raw(
    `ALTER TABLE SeasonLeagueTeams COMMENT = 'Team participation in season leagues'`
  );
  await knex.raw(
    `ALTER TABLE SeasonLeagueExternalIds COMMENT = 'Maps external platform IDs (FaceIT, etc.) to internal league structure'`
  );

  // Player Management
  await knex.raw(
    `ALTER TABLE SeasonTeamRegistrationPlayers COMMENT = 'Initial team registrations (registration phase of dual-roster system)'`
  );
  await knex.raw(
    `ALTER TABLE SeasonTeamPlayers COMMENT = 'Active team rosters for matches (competition phase of dual-roster system)'`
  );
  await knex.raw(
    `ALTER TABLE SeasonPlayerApprovals COMMENT = 'Employment verification workflow for players without work emails'`
  );
  await knex.raw(
    `ALTER TABLE SeasonPlayerRanks COMMENT = 'Player ranking information from multiple platforms'`
  );
  await knex.raw(
    `ALTER TABLE SteamPlayerKanaElo COMMENT = 'Global, persistent ELO system (not season-specific)'`
  );

  // Matches and Games
  await knex.raw(
    `ALTER TABLE Matches COMMENT = 'Match information (can be standalone or part of a season)'`
  );
  await knex.raw(
    `ALTER TABLE MatchGames COMMENT = 'Individual games within matches (BO1, BO3, BO5 support)'`
  );
  await knex.raw(
    `ALTER TABLE MatchTeams COMMENT = 'Teams participating in matches (includes season_id/league_id for composite FK constraint)'`
  );
  await knex.raw(
    `ALTER TABLE PlayerStats COMMENT = 'Detailed CS2 player statistics per game (parsed from demos)'`
  );
  await knex.raw(`ALTER TABLE TeamGameScores COMMENT = 'Team scores per game'`);
  await knex.raw(
    `ALTER TABLE MapRoundStats COMMENT = 'Round-by-round statistics for CS2 matches'`
  );
  await knex.raw(
    `ALTER TABLE PlayerTrades COMMENT = 'Detailed trade statistics for advanced analytics'`
  );
  await knex.raw(
    `ALTER TABLE MatchGameClips COMMENT = 'Clip metadata from Allstar partnership'`
  );
  await knex.raw(
    `ALTER TABLE MatchTeamMapVetoes COMMENT = 'Map veto data from FaceIT integration'`
  );

  // Permissions and Roles
  await knex.raw(
    `ALTER TABLE Roles COMMENT = 'System roles (captain, admin, etc.)'`
  );
  await knex.raw(`ALTER TABLE Permissions COMMENT = 'Individual permissions'`);
  await knex.raw(
    `ALTER TABLE RolePermissions COMMENT = 'Role-permission mappings (which permissions each role has)'`
  );
  await knex.raw(`ALTER TABLE AccountRoles COMMENT = 'User role assignments'`);
  await knex.raw(
    `ALTER TABLE AccountPermissionScopes COMMENT = 'Scoped permissions (season/team specific)'`
  );

  // External Integrations
  await knex.raw(
    `ALTER TABLE FaceitWebhooks COMMENT = 'Webhook processing for FaceIT integration'`
  );
  await knex.raw(
    `ALTER TABLE KanahautomoRegistrations COMMENT = 'Discord bot service for role management'`
  );
  await knex.raw(
    `ALTER TABLE Reservations COMMENT = 'Stream slot reservations for casters'`
  );
  await knex.raw(
    `ALTER TABLE AccountCasterUrls COMMENT = 'Multiple streaming platform URLs for casters'`
  );

  // Additional tables not explicitly mentioned in README but exist in schema
  await knex.raw(
    `ALTER TABLE Games COMMENT = 'Game types supported by the system'`
  );
  await knex.raw(`ALTER TABLE GameTypes COMMENT = 'Game type classifications'`);
  await knex.raw(`ALTER TABLE Maps COMMENT = 'Map information for games'`);
  await knex.raw(`ALTER TABLE Stages COMMENT = 'Tournament stage information'`);
  await knex.raw(
    `ALTER TABLE Organizers COMMENT = 'Tournament organizer information'`
  );
  await knex.raw(
    `ALTER TABLE OrganizerGames COMMENT = 'Links organizers to games'`
  );
  await knex.raw(
    `ALTER TABLE SeasonActiveMapPool COMMENT = 'Active map pool for a season'`
  );
  await knex.raw(
    `ALTER TABLE PublicEmailDomains COMMENT = 'Public email domains for validation'`
  );
  await knex.raw(
    `ALTER TABLE AuditLog COMMENT = 'Audit logging for system actions'`
  );
  await knex.raw(`ALTER TABLE FantasyTeams COMMENT = 'Fantasy league teams'`);
  await knex.raw(
    `ALTER TABLE FantasyTeamPlayers COMMENT = 'Players on fantasy teams'`
  );
  await knex.raw(
    `ALTER TABLE FantasyLeaderboard COMMENT = 'Fantasy league leaderboard'`
  );
  await knex.raw(
    `ALTER TABLE FantasyPlayerHistory COMMENT = 'Historical fantasy player data'`
  );
  await knex.raw(
    `ALTER TABLE FantasyPlayerValues COMMENT = 'Player values for fantasy leagues'`
  );
  await knex.raw(
    `ALTER TABLE FantasyPointsLog COMMENT = 'Log of fantasy points earned'`
  );
  await knex.raw(
    `ALTER TABLE GlobalPlayerPoints COMMENT = 'Global player points across all seasons'`
  );
  await knex.raw(
    `ALTER TABLE GlobalPlayerPointsLog COMMENT = 'Log of global player points changes'`
  );
  await knex.raw(
    `ALTER TABLE KillLogs COMMENT = 'Detailed kill log information'`
  );
  await knex.raw(
    `ALTER TABLE KanahautomoRegistrationGameTypes COMMENT = 'Links Kanahautomo registrations to game types'`
  );
  await knex.raw(`ALTER TABLE Trophies COMMENT = 'Trophy/award information'`);
  await knex.raw(
    `ALTER TABLE TrophyAssignments COMMENT = 'Trophy assignments to players/teams'`
  );
}

export async function down(knex: Knex): Promise<void> {
  // Remove all table comments by setting them to empty string
  const tables = [
    "Accounts",
    "LinkedAccounts",
    "SteamPlayers",
    "UserPolicyAcceptances",
    "Teams",
    "Organizations",
    "TeamRosters",
    "Seasons",
    "Leagues",
    "SeasonLeagues",
    "SeasonLeagueTeams",
    "SeasonLeagueExternalIds",
    "SeasonTeamRegistrationPlayers",
    "SeasonTeamPlayers",
    "SeasonPlayerApprovals",
    "SeasonPlayerRanks",
    "SteamPlayerKanaElo",
    "Matches",
    "MatchGames",
    "MatchTeams",
    "PlayerStats",
    "TeamGameScores",
    "MapRoundStats",
    "PlayerTrades",
    "MatchGameClips",
    "MatchTeamMapVetoes",
    "Roles",
    "Permissions",
    "RolePermissions",
    "AccountRoles",
    "AccountPermissionScopes",
    "FaceitWebhooks",
    "KanahautomoRegistrations",
    "Reservations",
    "AccountCasterUrls",
    "Games",
    "GameTypes",
    "Maps",
    "Stages",
    "Organizers",
    "OrganizerGames",
    "SeasonActiveMapPool",
    "PublicEmailDomains",
    "AuditLog",
    "FantasyTeams",
    "FantasyTeamPlayers",
    "FantasyLeaderboard",
    "FantasyPlayerHistory",
    "FantasyPlayerValues",
    "FantasyPointsLog",
    "GlobalPlayerPoints",
    "GlobalPlayerPointsLog",
    "KillLogs",
    "KanahautomoRegistrationGameTypes",
    "Trophies",
    "TrophyAssignments"
  ];

  for (const table of tables) {
    await knex.raw(`ALTER TABLE ${table} COMMENT = ''`);
  }
}
