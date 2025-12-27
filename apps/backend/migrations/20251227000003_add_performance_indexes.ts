import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 1. SeasonTeamPlayers active role lookup
  // Note: MariaDB doesn't support partial indexes, so we index all rows
  await knex.raw(`
    CREATE INDEX idx_season_team_player_role_active 
    ON SeasonTeamPlayers(season_id, team_id, role, discarded_at)
  `);

  // 2. Match date/league filtering
  // Note: MariaDB doesn't support partial indexes, so we index all rows
  await knex.raw(`
    CREATE INDEX idx_match_date_league_active 
    ON Matches(match_date DESC, league_id, season_id, status)
  `);

  // 3. Fantasy leaderboard queries
  await knex.raw(`
    CREATE INDEX idx_fantasy_leaderboard_lookup
    ON FantasyLeaderboard(season_id, league_id, week_number, rank)
  `);

  // 4. Fantasy active players
  // Note: MariaDB doesn't support partial indexes, so we index all rows
  await knex.raw(`
    CREATE INDEX idx_fantasy_team_players_active
    ON FantasyTeamPlayers(fantasy_team_id, steam_id, is_active)
  `);

  // 5. Captain status lookup (covering index)
  await knex.raw(`
    CREATE INDEX idx_season_team_captain_lookup
    ON SeasonTeamPlayers(season_id, team_id, steam_id, is_captain, is_co_captain, role)
  `);

  // 6. Match teams season lookup
  await knex.raw(`
    CREATE INDEX idx_match_teams_season_league
    ON MatchTeams(season_id, league_id, team_id, match_id)
  `);

  // 7. Player stats by steam_id (common in leaderboards)
  await knex.raw(`
    CREATE INDEX idx_player_stats_steam_game
    ON PlayerStats(steam_id, match_game_id, kills, deaths, adr)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    `DROP INDEX idx_season_team_player_role_active ON SeasonTeamPlayers`
  );
  await knex.raw(`DROP INDEX idx_match_date_league_active ON Matches`);
  await knex.raw(
    `DROP INDEX idx_fantasy_leaderboard_lookup ON FantasyLeaderboard`
  );
  await knex.raw(
    `DROP INDEX idx_fantasy_team_players_active ON FantasyTeamPlayers`
  );
  await knex.raw(
    `DROP INDEX idx_season_team_captain_lookup ON SeasonTeamPlayers`
  );
  await knex.raw(`DROP INDEX idx_match_teams_season_league ON MatchTeams`);
  await knex.raw(`DROP INDEX idx_player_stats_steam_game ON PlayerStats`);
}
