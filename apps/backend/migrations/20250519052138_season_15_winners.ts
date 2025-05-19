import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const season15Winners = `
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 15 AND league_id= 1 AND team_id= 2;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 15 AND league_id= 1 AND team_id= 594;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 15 AND league_id= 1 AND team_id= 66;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 15 AND league_id= 2 AND team_id= 2129;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 15 AND league_id= 2 AND team_id= 321;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 15 AND league_id= 2 AND team_id= 910;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 15 AND league_id= 13 AND team_id= 1989;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 15 AND league_id= 13 AND team_id= 2176;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 15 AND league_id= 13 AND team_id= 693;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 15 AND league_id= 5 AND team_id= 2076;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 15 AND league_id= 5 AND team_id= 2226;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 15 AND league_id= 5 AND team_id= 1950;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 15 AND league_id= 6 AND team_id= 506;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 15 AND league_id= 6 AND team_id= 306;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 15 AND league_id= 6 AND team_id= 2075;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 15 AND league_id= 7 AND team_id= 2076;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 15 AND league_id= 7 AND team_id= 2050;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 15 AND league_id= 7 AND team_id= 1019;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 15 AND league_id= 8 AND team_id= 2008;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 15 AND league_id= 8 AND team_id= 2100;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 15 AND league_id= 8 AND team_id= 1991;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 15 AND league_id= 9 AND team_id= 2131;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 15 AND league_id= 9 AND team_id= 2224;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 15 AND league_id= 9 AND team_id= 2179;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 15 AND league_id= 10 AND team_id= 85;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 15 AND league_id= 10 AND team_id= 2240;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 15 AND league_id= 10 AND team_id= 2132;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 15 AND league_id= 11 AND team_id= 609;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 15 AND league_id= 11 AND team_id= 1553;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 15 AND league_id= 11 AND team_id= 1578;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 15 AND league_id= 12 AND team_id= 1445;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 15 AND league_id= 12 AND team_id= 2242;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 15 AND league_id= 12 AND team_id= 13;
  `;

  const splittedStatements = season15Winners.split(";");
  for (const statement of splittedStatements) {
    if (statement.trim()) {
      await knex.raw(statement);
    }
  }
}

export async function down(_knex: Knex): Promise<void> {
  // NO-OP
}
