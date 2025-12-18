import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const season16Winners = `
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 16 AND league_id= 1 AND team_id= 66;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 16 AND league_id= 1 AND team_id= 594;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 16 AND league_id= 1 AND team_id= 1938;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 16 AND league_id= 2 AND team_id= 2204;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 16 AND league_id= 2 AND team_id= 75;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 16 AND league_id= 2 AND team_id= 1863;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 16 AND league_id= 13 AND team_id= 2134;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 16 AND league_id= 13 AND team_id= 1510;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 16 AND league_id= 13 AND team_id= 2289;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 16 AND league_id= 5 AND team_id= 2292;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 16 AND league_id= 5 AND team_id= 2159;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 16 AND league_id= 5 AND team_id= 2136;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 16 AND league_id= 6 AND team_id= 306;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 16 AND league_id= 6 AND team_id= 1657;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 16 AND league_id= 6 AND team_id= 2275;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 16 AND league_id= 7 AND team_id= 2282;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 16 AND league_id= 7 AND team_id= 2284;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 16 AND league_id= 7 AND team_id= 2208;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 16 AND league_id= 8 AND team_id= 1923;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 16 AND league_id= 8 AND team_id= 214;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 16 AND league_id= 8 AND team_id= 2265;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 16 AND league_id= 9 AND team_id= 85;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 16 AND league_id= 9 AND team_id= 1137;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 16 AND league_id= 9 AND team_id= 2278;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 16 AND league_id= 10 AND team_id= 1813;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 16 AND league_id= 10 AND team_id= 2050;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 16 AND league_id= 10 AND team_id= 1194;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 16 AND league_id= 11 AND team_id= 2287;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 16 AND league_id= 11 AND team_id= 1851;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 16 AND league_id= 11 AND team_id= 1390;
  `;

  const splittedStatements = season16Winners.split(";");
  for (const statement of splittedStatements) {
    if (statement.trim()) {
      await knex.raw(statement);
    }
  }
}

export async function down(_knex: Knex): Promise<void> {
  // NO-OP
}
