// -- Ensure that only one primary player per season is allowed
// DELIMITER //

// CREATE TRIGGER before_insert_primary_check
// BEFORE INSERT ON SeasonTeamPlayers
// FOR EACH ROW
// BEGIN
//     IF NEW.role = 'primary' THEN
//         -- Check if this player is already marked as primary in the same season
//         IF (SELECT COUNT(*) FROM SeasonTeamPlayers
//             WHERE season_id = NEW.season_id
//               AND role = 'primary'
//               AND steam_id = NEW.steam_id) > 0 THEN
//             SIGNAL SQLSTATE '45000'
//             SET MESSAGE_TEXT = 'A player can only be primary for one team per season';
//         END IF;
//     END IF;
// END;
// //

// CREATE TRIGGER before_update_primary_check
// BEFORE UPDATE ON SeasonTeamPlayers
// FOR EACH ROW
// BEGIN
//     IF NEW.role = 'primary' THEN
//         -- Check if the same player is already marked as primary in the same season, excluding this row
//         IF (SELECT COUNT(*) FROM SeasonTeamPlayers
//             WHERE season_id = NEW.season_id
//               AND role = 'primary'
//               AND steam_id = NEW.steam_id
//               AND (team_id <> NEW.team_id OR steam_id <> NEW.steam_id)) > 0 THEN
//             SIGNAL SQLSTATE '45000'
//             SET MESSAGE_TEXT = 'A player can only be primary for one team per season';
//         END IF;
//     END IF;
// END;
// //

// DELIMITER ;

/* eslint-disable @typescript-eslint/no-require-imports */
import * as fs from "fs";
import type { Knex } from "knex";
import { envConnection } from "./helpers/migrationsDbConnections";

export const config = { transaction: false };

// Import Games, Leagues, and Seasons tables
export async function up(): Promise<void> {
  // const baseDbConfig = {
  //   client: "mysql2",
  //   connection: {
  //     ...envConnection,
  //     user: process.env.DB_ROOT_USER ?? "root",
  //     password: process.env.DB_ROOT_PASSWORD ?? "dev-pass",
  //     database: "kanaliiga",
  //   },
  // };
  // const knex = require("knex");
  // const tempDb = knex(baseDbConfig);
  // const base = fs.readFileSync("./dbdump/kanaliiga.sql", "utf8");
  // const baseStatements = base.split(/\s;/).filter((stmt) => stmt.trim()); // Split SQL into individual statements
  // for (const statement of baseStatements) {
  //   console.log("Executing:", statement); // Log each statement for debugging
  //   await tempDb.raw(statement);
  // }
}

export async function down(knex: Knex): Promise<void> {
  // return knex.raw("DROP DATABASE IF EXISTS kanaliiga;");
}
