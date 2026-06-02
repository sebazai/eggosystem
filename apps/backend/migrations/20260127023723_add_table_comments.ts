import type { Knex } from "knex";

async function commentIfExists(
  knex: Knex,
  table: string,
  comment: string
): Promise<void> {
  const exists = await knex.schema.hasTable(table);
  if (exists) await knex.raw(`ALTER TABLE \`${table}\` COMMENT = '${comment}'`);
}

export async function up(knex: Knex): Promise<void> {
  // Accounts and Authentication
  await commentIfExists(
    knex,
    "Accounts",
    "User accounts with work email and profile info"
  );
  await commentIfExists(
    knex,
    "LinkedAccounts",
    "Links accounts to external providers (Steam, Discord, etc.)"
  );
  await commentIfExists(
    knex,
    "SteamPlayers",
    "Steam player information linked to accounts"
  );
  await commentIfExists(
    knex,
    "UserPolicyAcceptances",
    "GDPR compliance tracking for privacy policy consent"
  );

  // Teams and Organizations
  await commentIfExists(
    knex,
    "Teams",
    "Team information (can optionally belong to an organization)"
  );
  await commentIfExists(
    knex,
    "Organizations",
    "Company/organization information"
  );
  await commentIfExists(
    knex,
    "TeamRosters",
    "Future feature for persistent roster management across seasons"
  );

  // Seasons and Leagues
  await commentIfExists(
    knex,
    "Seasons",
    "Tournament seasons with game and organizer information"
  );
  await commentIfExists(knex, "Leagues", "League tiers/divisions");
  await commentIfExists(
    knex,
    "SeasonLeagues",
    "Links seasons to leagues with tier information"
  );
  await commentIfExists(
    knex,
    "SeasonLeagueTeams",
    "Team participation in season leagues"
  );
  await commentIfExists(
    knex,
    "SeasonLeagueExternalIds",
    "Maps external platform IDs (FaceIT, etc.) to internal league structure"
  );

  // Player Management
  await commentIfExists(
    knex,
    "SeasonTeamRegistrationPlayers",
    "Initial team registrations (registration phase of dual-roster system)"
  );
  await commentIfExists(
    knex,
    "SeasonTeamPlayers",
    "Active team rosters for matches (competition phase of dual-roster system)"
  );
  await commentIfExists(
    knex,
    "SeasonPlayerApprovals",
    "Employment verification workflow for players without work emails"
  );
  await commentIfExists(
    knex,
    "SeasonPlayerRanks",
    "Player ranking information from multiple platforms"
  );
  await commentIfExists(
    knex,
    "SteamPlayerKanaElo",
    "Global, persistent ELO system (not season-specific)"
  );

  // Matches and Games
  await commentIfExists(
    knex,
    "Matches",
    "Match information (can be standalone or part of a season)"
  );
  await commentIfExists(
    knex,
    "MatchGames",
    "Individual games within matches (BO1, BO3, BO5 support)"
  );
  await commentIfExists(
    knex,
    "MatchTeams",
    "Teams participating in matches (includes season_id/league_id for composite FK constraint)"
  );
  await commentIfExists(
    knex,
    "PlayerStats",
    "Detailed CS2 player statistics per game (parsed from demos)"
  );
  await commentIfExists(knex, "TeamGameScores", "Team scores per game");
  await commentIfExists(
    knex,
    "MapRoundStats",
    "Round-by-round statistics for CS2 matches"
  );
  await commentIfExists(
    knex,
    "PlayerTrades",
    "Detailed trade statistics for advanced analytics"
  );
  await commentIfExists(
    knex,
    "MatchGameClips",
    "Clip metadata from Allstar partnership"
  );
  await commentIfExists(
    knex,
    "MatchTeamMapVetoes",
    "Map veto data from FaceIT integration"
  );

  // Permissions and Roles
  await commentIfExists(knex, "Roles", "System roles (captain, admin, etc.)");
  await commentIfExists(knex, "Permissions", "Individual permissions");
  await commentIfExists(
    knex,
    "RolePermissions",
    "Role-permission mappings (which permissions each role has)"
  );
  await commentIfExists(knex, "AccountRoles", "User role assignments");
  await commentIfExists(
    knex,
    "AccountPermissionScopes",
    "Scoped permissions (season/team specific)"
  );

  // External Integrations
  await commentIfExists(
    knex,
    "FaceitWebhooks",
    "Webhook processing for FaceIT integration"
  );
  await commentIfExists(
    knex,
    "KanahautomoRegistrations",
    "Discord bot service for role management"
  );
  await commentIfExists(
    knex,
    "Reservations",
    "Stream slot reservations for casters"
  );
  await commentIfExists(
    knex,
    "AccountCasterUrls",
    "Multiple streaming platform URLs for casters"
  );

  // Additional tables
  await commentIfExists(knex, "Games", "Game types supported by the system");
  await commentIfExists(knex, "GameTypes", "Game type classifications");
  await commentIfExists(knex, "Maps", "Map information for games");
  await commentIfExists(knex, "Stages", "Tournament stage information");
  await commentIfExists(knex, "Organizers", "Tournament organizer information");
  await commentIfExists(knex, "OrganizerGames", "Links organizers to games");
  await commentIfExists(
    knex,
    "SeasonActiveMapPool",
    "Active map pool for a season"
  );
  await commentIfExists(
    knex,
    "PublicEmailDomains",
    "Public email domains for validation"
  );
  await commentIfExists(knex, "AuditLog", "Audit logging for system actions");
  await commentIfExists(knex, "FantasyTeams", "Fantasy league teams");
  await commentIfExists(knex, "FantasyTeamPlayers", "Players on fantasy teams");
  await commentIfExists(
    knex,
    "FantasyLeaderboard",
    "Fantasy league leaderboard"
  );
  await commentIfExists(
    knex,
    "FantasyPlayerHistory",
    "Historical fantasy player data"
  );
  await commentIfExists(
    knex,
    "FantasyPlayerValues",
    "Player values for fantasy leagues"
  );
  await commentIfExists(
    knex,
    "FantasyPointsLog",
    "Log of fantasy points earned"
  );
  await commentIfExists(
    knex,
    "GlobalPlayerPoints",
    "Global player points across all seasons"
  );
  await commentIfExists(
    knex,
    "GlobalPlayerPointsLog",
    "Log of global player points changes"
  );
  await commentIfExists(knex, "KillLogs", "Detailed kill log information");
  await commentIfExists(
    knex,
    "KanahautomoRegistrationGameTypes",
    "Links Kanahautomo registrations to game types"
  );
  await commentIfExists(knex, "Trophies", "Trophy/award information");
  await commentIfExists(
    knex,
    "TrophyAssignments",
    "Trophy assignments to players/teams"
  );
}

export async function down(knex: Knex): Promise<void> {
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
    const exists = await knex.schema.hasTable(table);
    if (exists) await knex.raw(`ALTER TABLE \`${table}\` COMMENT = ''`);
  }
}
