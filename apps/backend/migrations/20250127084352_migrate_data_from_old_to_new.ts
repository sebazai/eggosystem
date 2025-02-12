/* eslint-disable @typescript-eslint/no-require-imports */
import type { Knex } from "knex";
import {
  cleanTeamsWithCascade,
  experimentalTeamsIntoCompanies,
  migrateAlmostErrything,
  migrateCompanies,
  migrateMatchesAndReservations,
  migratePlayerStats,
  migrateRanks,
  migrateTrades,
} from "./helpers/migrations";
import { envConnection } from "./helpers/migrationsDbConnections";

export const config = { transaction: false };

// Migrate data from the old 'kana' database to the new one if kana table exists
export async function up(): Promise<void> {
  const baseDbConfig = {
    client: "mysql2",
    connection: {
      ...envConnection,
    },
  };

  const knex = require("knex");
  // Create a temporary connection without specifying a database
  const tempDb = knex(baseDbConfig);

  try {
    // Check if the 'kana' database exists
    const [rows] = await tempDb.raw("SHOW DATABASES LIKE 'kana';");

    if (rows.length === 0) {
      console.log("Database 'kana' does not exist. Skipping migration.");
      return; // Exit early to skip migration
    }

    console.log("Database 'kana' exists. Proceeding with migration.");
  } finally {
    await tempDb.destroy(); // Close temporary connection
  }

  await migrateCompanies();
  await migrateAlmostErrything();
  await migrateMatchesAndReservations();
  await migratePlayerStats();
  await migrateRanks();
  await migrateTrades();
  await cleanTeamsWithCascade();
  await experimentalTeamsIntoCompanies();
}

// Rollback only if the 'kana' database exists, as we have got the data from the old database
export async function down(knex: Knex): Promise<void> {
  const baseDbConfig = {
    client: "mysql2",
    connection: {
      ...envConnection,
    },
  };

  const knexi = require("knex");
  // Create a temporary connection without specifying a database
  const tempDb = knexi(baseDbConfig);

  try {
    // Check if the 'kana' database exists
    const [rows] = await tempDb.raw("SHOW DATABASES LIKE 'kana';");

    if (rows.length === 0) {
      console.log("Database 'kana' does not exist. Skipping rollback.");
      return; // Exit early to skip migration
    }

    console.log("Database 'kana' exists. Proceeding with rollback.");
  } finally {
    await tempDb.destroy(); // Close temporary connection
  }
  await knex.raw("DELETE FROM Ranks");
  await knex.raw("DELETE FROM PlayerStats");
  await knex.raw("DELETE FROM Trades");
  await knex.raw("DELETE FROM TeamRosters");
  await knex.raw("DELETE FROM Matches");
  await knex.raw("DELETE FROM MatchReservations");
  await knex.raw("DELETE FROM Reservations");
  await knex.raw("DELETE FROM SeasonTeamPlayers");
  await knex.raw("DELETE FROM Players");
  await knex.raw("DELETE FROM Matches");
  await knex.raw("DELETE FROM SeasonLeagueTeams");
  await knex.raw("DELETE FROM SeasonLeagues");
  await knex.raw("DELETE FROM SeasonTeams");
  await knex.raw("DELETE FROM Teams");
  await knex.raw("DELETE FROM Companies");
  await knex.raw("DELETE FROM Seasons");
  await knex.raw("DELETE FROM Games");
}
