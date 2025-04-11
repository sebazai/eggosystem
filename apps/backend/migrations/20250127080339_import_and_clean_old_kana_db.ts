/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-require-imports */
import type { Knex } from "knex";
import { envConnection } from "./helpers/migrationsDbConnections";

export const config = { transaction: false };

function getCleanDatabaseQueries() {
  return [
    // Remove tabs and spaces from steamID
    `
     UPDATE players 
     SET steamID = REPLACE(LTRIM(RTRIM(REPLACE(steamID, CHAR(9), ' '))), ' ', CHAR(9))
   `,
    `
     UPDATE stats_all_seasons 
     SET steamID = REPLACE(LTRIM(RTRIM(REPLACE(steamID, CHAR(9), ' '))), ' ', CHAR(9))
   `,
    // Fix specific steamIDs
    `
       UPDATE players 
       SET steamID = '76561197991248173' 
       WHERE id = 9457
     `,

    `
       UPDATE players 
       SET steamID = '76561197967466825' 
       WHERE id = 11648
     `,
    "DELETE FROM players WHERE steamID NOT LIKE '7%'",

    "DELETE FROM stats_all_seasons WHERE steamID NOT LIKE '7%'",

    `
  DELETE FROM teams 
  WHERE leagueID IN (
    SELECT DISTINCT a.leagueID 
    FROM teams a 
    LEFT JOIN leagues m ON m.id = a.leagueID 
    WHERE m.id IS NULL
  )
`,

    `
  DELETE FROM matches 
  WHERE leagueID IN (
    SELECT DISTINCT m.leagueID 
    FROM matches m 
    LEFT JOIN leagues t ON t.id = m.leagueID 
    WHERE t.id IS NULL
  )
`,

    `
  DELETE FROM players 
  WHERE teamId IN (
    SELECT DISTINCT m.teamId 
    FROM players m 
    LEFT JOIN teams t ON t.id = m.teamId 
    WHERE t.id IS NULL
  )
`,

    `
  DELETE FROM matches 
  WHERE team1 IN (
    SELECT DISTINCT m.team1 
    FROM matches m 
    LEFT JOIN teams t ON t.id = m.team1 
    WHERE t.id IS NULL
  )
`,

    `
  DELETE FROM matches 
  WHERE team2 IN (
    SELECT DISTINCT m.team2 
    FROM matches m 
    LEFT JOIN teams t ON t.id = m.team2 
    WHERE t.id IS NULL
  )
`,
    `
  DELETE FROM trades 
  WHERE matchID IN (
    SELECT DISTINCT a.matchID 
    FROM trades a 
    LEFT JOIN matches m ON m.id = a.matchID 
    WHERE m.id IS NULL
  )
`,

    `
  DELETE FROM roundInfo 
  WHERE matchID IN (
    SELECT DISTINCT a.matchID 
    FROM roundInfo a 
    LEFT JOIN matches m ON m.id = a.matchID 
    WHERE m.id IS NULL
  )
`,

    `
  DELETE FROM afterplant 
  WHERE matchID IN (
    SELECT DISTINCT a.matchID 
    FROM afterplant a 
    LEFT JOIN matches m ON m.id = a.matchID 
    WHERE m.id IS NULL
  )
`,

    `
  DELETE FROM stats_all_seasons 
  WHERE matchID IN (
    SELECT DISTINCT p.matchID 
    FROM stats_all_seasons p 
    LEFT JOIN matches t ON t.id = p.matchID 
    WHERE t.id IS NULL
  )
`,

    `
  DELETE FROM stats_all_seasons 
  WHERE steamID IN (
    SELECT DISTINCT p.steamID 
    FROM stats_all_seasons p 
    LEFT JOIN players t ON t.steamID = p.steamID 
    WHERE t.steamID IS NULL
  )
`,

    `
  DELETE FROM ranks 
  WHERE steamID IN (
    SELECT DISTINCT a.steamID 
    FROM ranks a 
    LEFT JOIN players m ON m.steamID = a.steamID 
    WHERE m.steamID IS NULL
  )
`,

    `
  DELETE FROM trades 
  WHERE Trader IN (
    SELECT DISTINCT a.Trader 
    FROM trades a 
    LEFT JOIN players m ON m.steamID = a.Trader 
    WHERE m.steamID IS NULL
  )
`,

    `
  DELETE FROM trades 
  WHERE Victim IN (
    SELECT DISTINCT a.Victim 
    FROM trades a 
    LEFT JOIN players m ON m.steamID = a.Victim 
    WHERE m.steamID IS NULL
  )
`,

    `
  DELETE FROM trades 
  WHERE Killer IN (
    SELECT DISTINCT a.Killer 
    FROM trades a 
    LEFT JOIN players m ON m.steamID = a.Killer 
    WHERE m.steamID IS NULL
  )
`,

    // Remove duplicate players in the same team, keeping the one with the lowest id
    `
  DELETE FROM players
  WHERE id NOT IN (
    SELECT MIN(id) 
    FROM players 
    GROUP BY steamID, teamId
  )
`,
    // Alter column types
    `
  ALTER TABLE ranks 
  CHANGE steamID steamID VARCHAR(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL
`,

    `
  ALTER TABLE stats_all_seasons 
  CHANGE steamID steamID VARCHAR(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL
`,

    // Add a new column
    `
  ALTER TABLE players 
  ADD isSub BOOLEAN NOT NULL DEFAULT FALSE
`,

    // Update isSub values
    `
  UPDATE players 
  SET isSub = '1' 
  WHERE id IN (
    235, 592, 594, 595, 675, 676, 677, 719, 720, 1119, 1129, 1130, 1131, 
    1296, 1299, 1301, 1403, 1514, 1701, 1704, 1707, 1708, 1760, 1762, 1771, 
    1774, 1798, 1799, 1833, 1835, 1839, 1840, 1933, 1935, 1936, 1937, 1978, 
    1979, 2003, 2004, 2006, 2056, 2134, 2192, 2193, 2292, 2293, 2294, 2295, 
    2346, 2349, 2564, 2386, 2391, 2392, 2402, 2403, 2404, 2405, 2408, 2526, 
    2938, 3112, 4220, 3917, 3918, 4172, 4174, 4193, 5376, 5521, 5678, 5679, 
    5238, 6098, 7612, 7609, 8155, 9492, 9493, 9494, 9495, 9496, 9497, 9498, 
    9500, 9501, 9502, 9503, 9504, 9506, 9508, 9509, 9510, 10938, 10939, 10949, 
    11657, 11658, 11660, 11661, 11662, 11663, 11664, 11665, 11666, 11669, 11670, 
    11671, 11673, 11674, 11675, 11676, 16919, 16920, 19703, 19706
  )
`,

    // Update match league
    `
  UPDATE matches 
  SET leagueID = 50 
  WHERE id = 8316
`,

    `
  ALTER TABLE afterplant 
  ADD CONSTRAINT match_id_fk 
  FOREIGN KEY (matchID) REFERENCES matches (id) 
  ON DELETE NO ACTION ON UPDATE NO ACTION
`,

    `
  ALTER TABLE trades 
  ADD CONSTRAINT matches_id_fk 
  FOREIGN KEY (matchID) REFERENCES matches (id) 
  ON DELETE NO ACTION ON UPDATE NO ACTION
`,

    `
  ALTER TABLE stats_all_seasons 
  ADD CONSTRAINT player_steamid 
  FOREIGN KEY (steamID) REFERENCES players (steamID) 
  ON DELETE NO ACTION ON UPDATE NO ACTION
`,

    `
  ALTER TABLE stats_all_seasons 
  ADD CONSTRAINT match_stats_fk 
  FOREIGN KEY (matchID) REFERENCES matches (id) 
  ON DELETE NO ACTION ON UPDATE NO ACTION
`,

    `
  ALTER TABLE teams 
  ADD CONSTRAINT league_id_fk 
  FOREIGN KEY (leagueID) REFERENCES leagues (id) 
  ON DELETE NO ACTION ON UPDATE NO ACTION
`,

    `
  ALTER TABLE roundInfo 
  ADD CONSTRAINT matches_fk 
  FOREIGN KEY (matchID) REFERENCES matches (id) 
  ON DELETE NO ACTION ON UPDATE NO ACTION
`,

    `
  ALTER TABLE ranks 
  ADD CONSTRAINT steam_id_players_fk 
  FOREIGN KEY (steamID) REFERENCES players (steamID) 
  ON DELETE NO ACTION ON UPDATE NO ACTION
`,

    `
  ALTER TABLE matches 
  ADD CONSTRAINT team1_fk 
  FOREIGN KEY (team1) REFERENCES teams (id) 
  ON DELETE NO ACTION ON UPDATE NO ACTION
`,

    `
  ALTER TABLE matches 
  ADD CONSTRAINT team2_fk 
  FOREIGN KEY (team2) REFERENCES teams (id) 
  ON DELETE NO ACTION ON UPDATE NO ACTION
`,

    `
  ALTER TABLE trades 
  ADD CONSTRAINT trader_fk 
  FOREIGN KEY (Trader) REFERENCES players (steamID) 
  ON DELETE NO ACTION ON UPDATE NO ACTION
`,

    `
  ALTER TABLE trades 
  ADD CONSTRAINT killer_fk 
  FOREIGN KEY (Killer) REFERENCES players (steamID) 
  ON DELETE NO ACTION ON UPDATE NO ACTION
`,

    `
  ALTER TABLE trades 
  ADD CONSTRAINT victim_fk 
  FOREIGN KEY (Victim) REFERENCES players (steamID) 
  ON DELETE NO ACTION ON UPDATE NO ACTION
`,

    `
  ALTER TABLE players 
  ADD CONSTRAINT team_id_player_fk 
  FOREIGN KEY (teamId) REFERENCES teams (id) 
  ON DELETE NO ACTION ON UPDATE NO ACTION
`,
    `
  DELETE FROM teamsbuild_s11 
  WHERE id IN (SELECT id FROM (SELECT t.id FROM teamsbuild_s11 t WHERE Name LIKE "Team Organization%") as subquery)
`,

    `
  DELETE FROM teamsbuild_s12 
  WHERE id IN (SELECT id FROM (SELECT t.id FROM teamsbuild_s12 t WHERE Name LIKE "Team Organization%") as subquery)
`,

    `
  DELETE FROM teamsbuild_s13 
  WHERE id IN (SELECT id FROM (SELECT t.id FROM teamsbuild_s13 t WHERE Name LIKE "Team Organization%") as subquery)
`,

    `
  DELETE FROM teamsbuild_s14 
  WHERE id IN (SELECT id FROM (SELECT t.id FROM teamsbuild_s14 t WHERE Name LIKE "Team Organization%") as subquery)
`,

    `
  DELETE FROM teamsbuild_s11 
  WHERE id IN (SELECT id FROM (SELECT t.id FROM teamsbuild_s11 t WHERE yritys LIKE "Organization%") as subquery)
`,

    `
  DELETE FROM teamsbuild_s12 
  WHERE id IN (SELECT id FROM (SELECT t.id FROM teamsbuild_s12 t WHERE yritys LIKE "Organization%") as subquery)
`,

    `
  DELETE FROM teamsbuild_s13 
  WHERE id IN (SELECT id FROM (SELECT t.id FROM teamsbuild_s13 t WHERE yritys LIKE "Organization%") as subquery)
`,

    `
  DELETE FROM teamsbuild_s14 
  WHERE id IN (SELECT id FROM (SELECT t.id FROM teamsbuild_s14 t WHERE yritys LIKE "Organization%") as subquery)
`,

    `
  DELETE FROM teamsbuild_s11 
  WHERE id IN (SELECT id FROM (SELECT t.id FROM teamsbuild_s11 t WHERE yrityksen_y_tunnus LIKE "1234567-8") as subquery)
`,

    `
  DELETE FROM teamsbuild_s12 
  WHERE id IN (SELECT id FROM (SELECT t.id FROM teamsbuild_s12 t WHERE yrityksen_y_tunnus LIKE "1234567-8") as subquery)
`,

    `
  DELETE FROM teamsbuild_s13 
  WHERE id IN (SELECT id FROM (SELECT t.id FROM teamsbuild_s13 t WHERE yrityksen_y_tunnus LIKE "1234567-8") as subquery)
`,

    `
  DELETE FROM teamsbuild_s14 
  WHERE id IN (SELECT id FROM (SELECT t.id FROM teamsbuild_s14 t WHERE yrityksen_y_tunnus LIKE "1234567-8") as subquery)
`,
    `
  UPDATE teamsbuild
  SET yrityksen_y_tunnus = REPLACE(LTRIM(RTRIM(REPLACE(yrityksen_y_tunnus, CHAR(9), '    '))), '    ', CHAR(9))
`,

    `
  UPDATE teamsbuild_s11
  SET yrityksen_y_tunnus = REPLACE(LTRIM(RTRIM(REPLACE(yrityksen_y_tunnus, CHAR(9), '    '))), '    ', CHAR(9))
`,

    `
  UPDATE teamsbuild_s12
  SET yrityksen_y_tunnus = REPLACE(LTRIM(RTRIM(REPLACE(yrityksen_y_tunnus, CHAR(9), '    '))), '    ', CHAR(9))
`,

    `
  UPDATE teamsbuild_s13
  SET yrityksen_y_tunnus = REPLACE(LTRIM(RTRIM(REPLACE(yrityksen_y_tunnus, CHAR(9), '    '))), '    ', CHAR(9))
`,

    `
  UPDATE teamsbuild_s14
  SET yrityksen_y_tunnus = REPLACE(LTRIM(RTRIM(REPLACE(yrityksen_y_tunnus, CHAR(9), '    '))), '    ', CHAR(9))
`,
    `
  UPDATE teamsbuild
  SET Name = REPLACE(LTRIM(RTRIM(REPLACE(Name, CHAR(9), '    '))), '    ', CHAR(9))
`,

    `
  UPDATE teamsbuild_s11
  SET Name = REPLACE(LTRIM(RTRIM(REPLACE(Name, CHAR(9), '    '))), '    ', CHAR(9))
`,

    `
  UPDATE teamsbuild_s12
  SET Name = REPLACE(LTRIM(RTRIM(REPLACE(Name, CHAR(9), '    '))), '    ', CHAR(9))
`,

    `
  UPDATE teamsbuild_s13
  SET Name = REPLACE(LTRIM(RTRIM(REPLACE(Name, CHAR(9), '    '))), '    ', CHAR(9))
`,

    `
  UPDATE teamsbuild_s14
  SET Name = REPLACE(LTRIM(RTRIM(REPLACE(Name, CHAR(9), '    '))), '    ', CHAR(9))
`,
    `
  UPDATE teamsbuild
  SET yritys = REPLACE(LTRIM(RTRIM(REPLACE(yritys, CHAR(9), '    '))), '    ', CHAR(9))
`,

    `
  UPDATE teamsbuild_s11
  SET yritys = REPLACE(LTRIM(RTRIM(REPLACE(yritys, CHAR(9), '    '))), '    ', CHAR(9))
`,

    `
  UPDATE teamsbuild_s12
  SET yritys = REPLACE(LTRIM(RTRIM(REPLACE(yritys, CHAR(9), '    '))), '    ', CHAR(9))
`,

    `
  UPDATE teamsbuild_s13
  SET yritys = REPLACE(LTRIM(RTRIM(REPLACE(yritys, CHAR(9), '    '))), '    ', CHAR(9))
`,

    `
  UPDATE teamsbuild_s14
  SET yritys = REPLACE(LTRIM(RTRIM(REPLACE(yritys, CHAR(9), '    '))), '    ', CHAR(9))
`,

    `
  DELETE FROM afterplant
  WHERE id NOT IN (
    SELECT MAX(id)
    FROM (SELECT * FROM afterplant) AS subquery
    GROUP BY matchID, round
  )
`
  ];
}

// This will only run if dbdump/kanaclean.sql exists, used only to import old data
export async function up(knex: Knex): Promise<void> {
  // Check if the 'kana' database exists
  const [rows] = await knex.raw("SHOW DATABASES LIKE 'kana';");
  if (rows.length === 0) {
    return;
  }
  console.log("Database 'kana' exists. Proceeding with migration.");

  const oldKanaDbConfig = {
    client: "mysql2",
    connection: {
      ...envConnection,
      database: "kana"
    }
  };

  const otherDb = require("knex")(oldKanaDbConfig);

  try {
    console.log("Cleaning up the old Kana database...");
    const queries = getCleanDatabaseQueries();
    for (const query of queries) {
      await otherDb.raw(query);
    }
    console.log("Finished cleaning...");
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    await otherDb.destroy(); // Ensure database connection is closed
  }
}

export async function down(knex: Knex): Promise<void> {
  // Drop table kana if exists
  await knex.raw("DROP DATABASE IF EXISTS kana;");
}
