import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonLeagueTeams", (table) => {
    table.tinyint("placement").unsigned().nullable(); // Adjust nullability if needed
    table.tinyint("position_offset").unsigned().nullable();
  });
  const updateWinners = `
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 3 AND league_id= 16 AND team_id= 20;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 3 AND league_id= 15 AND team_id= 49;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 3 AND league_id= 17 AND team_id= 32;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 4 AND league_id= 1 AND team_id= 20;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 4 AND league_id= 2 AND team_id= 87;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 4 AND league_id= 3 AND team_id= 389;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 4 AND league_id= 4 AND team_id= 51;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 4 AND league_id= 5 AND team_id= 104;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 4 AND league_id= 6 AND team_id= 170;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 5 AND league_id= 1 AND team_id= 203;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 5 AND league_id= 2 AND team_id= 75;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 5 AND league_id= 3 AND team_id= 350;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 5 AND league_id= 4 AND team_id= 354;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 5 AND league_id= 5 AND team_id= 190;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 5 AND league_id= 6 AND team_id= 358;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 6 AND league_id= 1 AND team_id= 8;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 6 AND league_id= 2 AND team_id= 493;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 6 AND league_id= 3 AND team_id= 426;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 6 AND league_id= 4 AND team_id= 358;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 6 AND league_id= 5 AND team_id= 154;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 6 AND league_id= 6 AND team_id= 465;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 7 AND league_id= 1 AND team_id= 415;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 7 AND league_id= 2 AND team_id= 113;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 7 AND league_id= 3 AND team_id= 190;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 7 AND league_id= 4 AND team_id= 77;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 7 AND league_id= 5 AND team_id= 670;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 7 AND league_id= 6 AND team_id= 701;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 7 AND league_id= 7 AND team_id= 735;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 7 AND league_id= 8 AND team_id= 238;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 8 AND league_id= 1 AND team_id= 537;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 8 AND league_id= 1 AND team_id= 658;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 8 AND league_id= 1 AND team_id= 8;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 8 AND league_id= 2 AND team_id= 844;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 8 AND league_id= 2 AND team_id= 930;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 8 AND league_id= 2 AND team_id= 910;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 8 AND league_id= 3 AND team_id= 851;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 8 AND league_id= 3 AND team_id= 931;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 8 AND league_id= 3 AND team_id= 700;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 8 AND league_id= 4 AND team_id= 287;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 8 AND league_id= 5 AND team_id= 891;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 8 AND league_id= 6 AND team_id= 840;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 8 AND league_id= 7 AND team_id= 167;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 8 AND league_id= 8 AND team_id= 459;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 9 AND league_id= 1 AND team_id= 8;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 9 AND league_id= 1 AND team_id= 493;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 9 AND league_id= 1 AND team_id= 537;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 9 AND league_id= 2 AND team_id= 594;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 9 AND league_id= 2 AND team_id= 364;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 9 AND league_id= 2 AND team_id= 280;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 9 AND league_id= 3 AND team_id= 1034;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 9 AND league_id= 3 AND team_id= 671;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 9 AND league_id= 3 AND team_id= 668;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 9 AND league_id= 4 AND team_id= 913;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 9 AND league_id= 5 AND team_id= 736;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 9 AND league_id= 6 AND team_id= 1152;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 9 AND league_id= 7 AND team_id= 1137;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 9 AND league_id= 8 AND team_id= 946;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 9 AND league_id= 9 AND team_id= 880;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 10 AND league_id= 1 AND team_id= 1238;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 10 AND league_id= 1 AND team_id= 493;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 10 AND league_id= 1 AND team_id= 8;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 10 AND league_id= 2 AND team_id= 851;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 10 AND league_id= 2 AND team_id= 1341;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 10 AND league_id= 2 AND team_id= 194;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 10 AND league_id= 3 AND team_id= 1342;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 10 AND league_id= 3 AND team_id= 386;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 10 AND league_id= 3 AND team_id= 1096;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 10 AND league_id= 4 AND team_id= 850;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 10 AND league_id= 5 AND team_id= 412;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 10 AND league_id= 6 AND team_id= 1365;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 10 AND league_id= 7 AND team_id= 1300;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 10 AND league_id= 8 AND team_id= 1331;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 10 AND league_id= 9 AND team_id= 331;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 10 AND league_id= 10 AND team_id= 1410;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 11 AND league_id= 1 AND team_id= 875;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 11 AND league_id= 1 AND team_id= 1341;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 11 AND league_id= 1 AND team_id= 594;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 11 AND league_id= 2 AND team_id= 1550;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 11 AND league_id= 2 AND team_id= 1475;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 11 AND league_id= 2 AND team_id= 1028;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 11 AND league_id= 3 AND team_id= 1566;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 11 AND league_id= 3 AND team_id= 1555;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 11 AND league_id= 3 AND team_id= 756;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 11 AND league_id= 4 AND team_id= 184;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 11 AND league_id= 5 AND team_id= 736;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 11 AND league_id= 6 AND team_id= 515;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 11 AND league_id= 7 AND team_id= 207;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 11 AND league_id= 8 AND team_id= 187;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 11 AND league_id= 9 AND team_id= 1304;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 12 AND league_id= 1 AND team_id= 66;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 12 AND league_id= 1 AND team_id= 1550;
    UPDATE SeasonLeagueTeams SET placement = 3, position_offset = 1 WHERE season_id= 12 AND league_id= 1 AND team_id= 1028;
    UPDATE SeasonLeagueTeams SET placement = 3, position_offset = 1 WHERE season_id= 12 AND league_id= 1 AND team_id= 122;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 12 AND league_id= 2 AND team_id= 386;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 12 AND league_id= 2 AND team_id= 930;
    UPDATE SeasonLeagueTeams SET placement = 3, position_offset = 1 WHERE season_id= 12 AND league_id= 2 AND team_id= 408;
    UPDATE SeasonLeagueTeams SET placement = 3, position_offset = 1 WHERE season_id= 12 AND league_id= 2 AND team_id= 1455;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 12 AND league_id= 3 AND team_id= 321;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 12 AND league_id= 3 AND team_id= 1697;
    UPDATE SeasonLeagueTeams SET placement = 3, position_offset = 1 WHERE season_id= 12 AND league_id= 3 AND team_id= 1306;
    UPDATE SeasonLeagueTeams SET placement = 3, position_offset = 1 WHERE season_id= 12 AND league_id= 3 AND team_id= 1342;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 12 AND league_id= 4 AND team_id= 1062;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 12 AND league_id= 4 AND team_id= 1173;
    UPDATE SeasonLeagueTeams SET placement = 3, position_offset = 1 WHERE season_id= 12 AND league_id= 4 AND team_id= 1670;
    UPDATE SeasonLeagueTeams SET placement = 3, position_offset = 1 WHERE season_id= 12 AND league_id= 4 AND team_id= 1750;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 12 AND league_id= 5 AND team_id= 1390;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 12 AND league_id= 5 AND team_id= 736;
    UPDATE SeasonLeagueTeams SET placement = 3, position_offset = 1 WHERE season_id= 12 AND league_id= 5 AND team_id= 1703;
    UPDATE SeasonLeagueTeams SET placement = 3, position_offset = 1 WHERE season_id= 12 AND league_id= 5 AND team_id= 749;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 12 AND league_id= 6 AND team_id= 1693;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 12 AND league_id= 6 AND team_id= 207;
    UPDATE SeasonLeagueTeams SET placement = 3, position_offset = 1 WHERE season_id= 12 AND league_id= 6 AND team_id= 418;
    UPDATE SeasonLeagueTeams SET placement = 3, position_offset = 1 WHERE season_id= 12 AND league_id= 6 AND team_id= 1796;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 13 AND league_id= 1 AND team_id= 1028;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 13 AND league_id= 1 AND team_id= 756;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 13 AND league_id= 1 AND team_id= 1550;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 13 AND league_id= 2 AND team_id= 1475;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 13 AND league_id= 2 AND team_id= 166;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 13 AND league_id= 2 AND team_id= 408;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 13 AND league_id= 3 AND team_id= 434;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 13 AND league_id= 3 AND team_id= 1950;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 13 AND league_id= 3 AND team_id= 1446;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 13 AND league_id= 4 AND team_id= 1588;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 13 AND league_id= 5 AND team_id= 1473;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 13 AND league_id= 6 AND team_id= 1851;

    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 14 AND league_id= 1 AND team_id= 66;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 14 AND league_id= 1 AND team_id= 1028;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 14 AND league_id= 1 AND team_id= 1697;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 14 AND league_id= 2 AND team_id= 2119;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 14 AND league_id= 2 AND team_id= 1938;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 14 AND league_id= 2 AND team_id= 1863;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 14 AND league_id= 3 AND team_id= 1254;
    UPDATE SeasonLeagueTeams SET placement = 2 WHERE season_id= 14 AND league_id= 3 AND team_id= 2110;
    UPDATE SeasonLeagueTeams SET placement = 3 WHERE season_id= 14 AND league_id= 3 AND team_id= 1975;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 14 AND league_id= 4 AND team_id= 2075;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 14 AND league_id= 5 AND team_id= 257;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 14 AND league_id= 6 AND team_id= 967;
    UPDATE SeasonLeagueTeams SET placement = 1 WHERE season_id= 14 AND league_id= 7 AND team_id= 2060;
`;

  const splittedStatements = updateWinners.split(";");
  for (const statement of splittedStatements) {
    if (statement.trim()) {
      await knex.raw(statement);
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("SeasonLeagueTeams", (table) => {
    table.dropUnique(["season_id", "league_id", "placement"]);
    table.dropColumn("placement");
  });
}
