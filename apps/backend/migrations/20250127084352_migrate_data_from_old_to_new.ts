/* eslint-disable no-console */
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
  teamLogosToCompanies
} from "./helpers/migrations";
import { envConnection } from "./helpers/migrationsDbConnections";

export const config = { transaction: false };

const insertSeasonLeagues = async (knex: Knex) => {
  await knex("Games").insert({
    id: 1,
    name: "Counter-Strike",
    abbreviation: "CS"
  });

  await knex("Seasons").insert([
    {
      id: 2,
      game_id: 1,
      name: "Season 2",
      full_name: "CS:GO Season 2",
      start_date: "2019-01-01",
      end_date: "2019-06-01",
      platform: "popflash"
    },
    {
      id: 3,
      game_id: 1,
      name: "Season 3",
      full_name: "CS:GO Season 3",
      start_date: "2019-08-23",
      end_date: "2019-10-26",
      platform: "kanaliiga"
    },
    {
      id: 4,
      game_id: 1,
      name: "Season 4",
      full_name: "CS:GO Season 4",
      start_date: "2019-11-04",
      end_date: "2020-03-03",
      platform: "kanaliiga"
    },
    {
      id: 5,
      game_id: 1,
      name: "Season 5",
      full_name: "CS:GO Season 5",
      start_date: "2020-03-15",
      end_date: "2020-08-21",
      platform: "kanaliiga"
    },
    {
      id: 6,
      game_id: 1,
      name: "Season 6",
      full_name: "CS:GO Season 6",
      start_date: "2020-08-31",
      end_date: "2021-01-16",
      platform: "kanaliiga"
    },
    {
      id: 7,
      game_id: 1,
      name: "Season 7",
      full_name: "CS:GO Season 7",
      start_date: "2021-02-01",
      end_date: "2021-05-29",
      platform: "kanaliiga"
    },
    {
      id: 8,
      game_id: 1,
      name: "Season 8",
      full_name: "CS:GO Season 8",
      start_date: "2021-08-30",
      end_date: "2021-12-20",
      platform: "kanaliiga"
    },
    {
      id: 9,
      game_id: 1,
      name: "Season 9",
      full_name: "CS:GO Season 9",
      start_date: "2022-01-30",
      end_date: "2022-06-21",
      platform: "kanaliiga"
    },
    {
      id: 10,
      game_id: 1,
      name: "Season 10",
      full_name: "CS:GO Season 10",
      start_date: "2022-08-24",
      end_date: "2022-12-12",
      platform: "kanaliiga"
    },
    {
      id: 11,
      game_id: 1,
      name: "Season 11",
      full_name: "CS:GO Season 11",
      start_date: "2023-01-30",
      end_date: "2023-05-15",
      platform: "kanaliiga"
    },
    {
      id: 12,
      game_id: 1,
      name: "Testing 1",
      full_name: "CS2 Testing 1",
      start_date: "2023-11-06",
      end_date: "2023-12-15",
      platform: "esportal"
    },
    {
      id: 13,
      game_id: 1,
      name: "Season 1",
      full_name: "CS2 Season 1",
      start_date: "2024-01-29",
      end_date: "2024-05-07",
      platform: "esportal"
    },
    {
      id: 14,
      game_id: 1,
      name: "Season 2",
      full_name: "CS2 Season 2",
      start_date: "2024-09-03",
      end_date: "2024-12-08",
      platform: "faceit"
    },
    {
      id: 15,
      game_id: 1,
      name: "Season 3",
      full_name: "CS2 Season 3",
      start_date: "2025-02-02",
      end_date: "2025-05-17",
      platform: "faceit"
    },
    {
      id: 16,
      game_id: 1,
      name: "Season 4",
      full_name: "CS2 Season 4",
      start_date: "2025-09-01",
      end_date: null,
      signup_start_date: "2025-06-01 00:00:00",
      signup_end_date: "2025-08-22 23:59:59",
      platform: "faceit"
    }
  ]);
  await knex("Leagues").insert([
    { id: 1, name: "Masters" },
    { id: 2, name: "Challengers" },
    { id: 3, name: "div2" },
    { id: 4, name: "div3" },
    { id: 5, name: "div4" },
    { id: 6, name: "div5" },
    { id: 7, name: "div6" },
    { id: 8, name: "div7" },
    { id: 9, name: "div8" },
    { id: 10, name: "div9" },
    { id: 11, name: "div10" },
    { id: 12, name: "div11" },
    { id: 13, name: "Prospects" },
    { id: 14, name: "kanakahakka" },
    { id: 15, name: "Semi-pro" },
    { id: 16, name: "Pro" },
    { id: 17, name: "MKT" }
  ]);
  await knex("SeasonLeagues").insert([
    { old_kana_league_id: 1, league_id: 17, tier: 3, season_id: 3 },
    { old_kana_league_id: 2, league_id: 15, tier: 2, season_id: 3 },
    { old_kana_league_id: 3, league_id: 16, tier: 1, season_id: 3 },
    { old_kana_league_id: 6, league_id: 1, tier: 1, season_id: 4 },
    { old_kana_league_id: 7, league_id: 2, tier: 2, season_id: 4 },
    { old_kana_league_id: 8, league_id: 3, tier: 3, season_id: 4 },
    { old_kana_league_id: 9, league_id: 4, tier: 4, season_id: 4 },
    { old_kana_league_id: 10, league_id: 5, tier: 5, season_id: 4 },
    { old_kana_league_id: 11, league_id: 6, tier: 6, season_id: 4 },
    { old_kana_league_id: 12, league_id: 1, tier: 1, season_id: 5 },
    { old_kana_league_id: 13, league_id: 2, tier: 2, season_id: 5 },
    { old_kana_league_id: 14, league_id: 3, tier: 3, season_id: 5 },
    { old_kana_league_id: 15, league_id: 4, tier: 4, season_id: 5 },
    { old_kana_league_id: 16, league_id: 5, tier: 5, season_id: 5 },
    { old_kana_league_id: 17, league_id: 6, tier: 6, season_id: 5 },
    { old_kana_league_id: 18, league_id: 7, tier: 7, season_id: 5 },
    { old_kana_league_id: 19, league_id: 1, tier: 1, season_id: 6 },
    { old_kana_league_id: 20, league_id: 2, tier: 2, season_id: 6 },
    { old_kana_league_id: 21, league_id: 3, tier: 3, season_id: 6 },
    { old_kana_league_id: 22, league_id: 4, tier: 4, season_id: 6 },
    { old_kana_league_id: 23, league_id: 5, tier: 5, season_id: 6 },
    { old_kana_league_id: 24, league_id: 6, tier: 6, season_id: 6 },
    { old_kana_league_id: 25, league_id: 1, tier: 1, season_id: 7 },
    { old_kana_league_id: 26, league_id: 2, tier: 2, season_id: 7 },
    { old_kana_league_id: 27, league_id: 3, tier: 3, season_id: 7 },
    { old_kana_league_id: 28, league_id: 4, tier: 4, season_id: 7 },
    { old_kana_league_id: 29, league_id: 5, tier: 5, season_id: 7 },
    { old_kana_league_id: 30, league_id: 6, tier: 6, season_id: 7 },
    { old_kana_league_id: 31, league_id: 7, tier: 7, season_id: 7 },
    { old_kana_league_id: 32, league_id: 8, tier: 8, season_id: 7 },
    { old_kana_league_id: 33, league_id: 1, tier: 1, season_id: 8 },
    { old_kana_league_id: 34, league_id: 2, tier: 2, season_id: 8 },
    { old_kana_league_id: 35, league_id: 3, tier: 3, season_id: 8 },
    { old_kana_league_id: 36, league_id: 4, tier: 4, season_id: 8 },
    { old_kana_league_id: 37, league_id: 5, tier: 5, season_id: 8 },
    { old_kana_league_id: 38, league_id: 6, tier: 6, season_id: 8 },
    { old_kana_league_id: 39, league_id: 7, tier: 7, season_id: 8 },
    { old_kana_league_id: 40, league_id: 8, tier: 8, season_id: 8 },
    { old_kana_league_id: 666, league_id: 14, tier: 9, season_id: 8 },
    { old_kana_league_id: 41, league_id: 1, tier: 1, season_id: 9 },
    { old_kana_league_id: 42, league_id: 2, tier: 2, season_id: 9 },
    { old_kana_league_id: 43, league_id: 3, tier: 3, season_id: 9 },
    { old_kana_league_id: 44, league_id: 4, tier: 4, season_id: 9 },
    { old_kana_league_id: 45, league_id: 5, tier: 5, season_id: 9 },
    { old_kana_league_id: 46, league_id: 6, tier: 6, season_id: 9 },
    { old_kana_league_id: 47, league_id: 7, tier: 7, season_id: 9 },
    { old_kana_league_id: 48, league_id: 8, tier: 8, season_id: 9 },
    { old_kana_league_id: 49, league_id: 9, tier: 9, season_id: 9 },
    { old_kana_league_id: 50, league_id: 14, tier: 10, season_id: 9 },
    { old_kana_league_id: 51, league_id: 1, tier: 1, season_id: 10 },
    { old_kana_league_id: 52, league_id: 2, tier: 2, season_id: 10 },
    { old_kana_league_id: 53, league_id: 3, tier: 3, season_id: 10 },
    { old_kana_league_id: 54, league_id: 4, tier: 4, season_id: 10 },
    { old_kana_league_id: 55, league_id: 5, tier: 5, season_id: 10 },
    { old_kana_league_id: 56, league_id: 6, tier: 6, season_id: 10 },
    { old_kana_league_id: 57, league_id: 7, tier: 7, season_id: 10 },
    { old_kana_league_id: 58, league_id: 8, tier: 8, season_id: 10 },
    { old_kana_league_id: 59, league_id: 9, tier: 9, season_id: 10 },
    { old_kana_league_id: 60, league_id: 10, tier: 10, season_id: 10 },
    { old_kana_league_id: 61, league_id: 14, tier: 11, season_id: 10 },
    { old_kana_league_id: 62, league_id: 1, tier: 1, season_id: 11 },
    { old_kana_league_id: 63, league_id: 2, tier: 2, season_id: 11 },
    { old_kana_league_id: 64, league_id: 3, tier: 3, season_id: 11 },
    { old_kana_league_id: 65, league_id: 4, tier: 4, season_id: 11 },
    { old_kana_league_id: 66, league_id: 5, tier: 5, season_id: 11 },
    { old_kana_league_id: 67, league_id: 6, tier: 6, season_id: 11 },
    { old_kana_league_id: 68, league_id: 7, tier: 7, season_id: 11 },
    { old_kana_league_id: 69, league_id: 8, tier: 8, season_id: 11 },
    { old_kana_league_id: 70, league_id: 9, tier: 9, season_id: 11 },
    { old_kana_league_id: 71, league_id: 1, tier: 1, season_id: 12 },
    { old_kana_league_id: 72, league_id: 2, tier: 2, season_id: 12 },
    { old_kana_league_id: 73, league_id: 3, tier: 3, season_id: 12 },
    { old_kana_league_id: 74, league_id: 4, tier: 4, season_id: 12 },
    { old_kana_league_id: 75, league_id: 5, tier: 5, season_id: 12 },
    { old_kana_league_id: 76, league_id: 6, tier: 6, season_id: 12 },
    { old_kana_league_id: 78, league_id: 1, tier: 1, season_id: 13 },
    { old_kana_league_id: 79, league_id: 2, tier: 2, season_id: 13 },
    { old_kana_league_id: 80, league_id: 3, tier: 3, season_id: 13 },
    { old_kana_league_id: 81, league_id: 4, tier: 4, season_id: 13 },
    { old_kana_league_id: 82, league_id: 5, tier: 5, season_id: 13 },
    { old_kana_league_id: 83, league_id: 6, tier: 6, season_id: 13 },
    { old_kana_league_id: 84, league_id: 1, tier: 1, season_id: 14 },
    { old_kana_league_id: 85, league_id: 2, tier: 2, season_id: 14 },
    { old_kana_league_id: 86, league_id: 3, tier: 3, season_id: 14 },
    { old_kana_league_id: 87, league_id: 4, tier: 4, season_id: 14 },
    { old_kana_league_id: 88, league_id: 5, tier: 5, season_id: 14 },
    { old_kana_league_id: 89, league_id: 6, tier: 6, season_id: 14 },
    { old_kana_league_id: 90, league_id: 7, tier: 7, season_id: 14 },
    { old_kana_league_id: 91, league_id: 1, tier: 1, season_id: 15 },
    { old_kana_league_id: 92, league_id: 2, tier: 2, season_id: 15 },
    { old_kana_league_id: 93, league_id: 13, tier: 3, season_id: 15 },
    { old_kana_league_id: 94, league_id: 5, tier: 4, season_id: 15 },
    { old_kana_league_id: 95, league_id: 6, tier: 5, season_id: 15 },
    { old_kana_league_id: 96, league_id: 7, tier: 6, season_id: 15 },
    { old_kana_league_id: 97, league_id: 8, tier: 7, season_id: 15 },
    { old_kana_league_id: 98, league_id: 9, tier: 8, season_id: 15 },
    { old_kana_league_id: 99, league_id: 10, tier: 9, season_id: 15 },
    { old_kana_league_id: 100, league_id: 11, tier: 10, season_id: 15 },
    { old_kana_league_id: 101, league_id: 12, tier: 11, season_id: 15 }
  ]);
};

// Migrate data from the old 'kana' database to the new one if kana table exists
export async function up(knex: Knex): Promise<void> {
  const baseDbConfig = {
    client: "mysql2",
    connection: {
      ...envConnection
    }
  };

  const knexi = require("knex");
  // Create a temporary connection without specifying a database
  const tempDb = knexi(baseDbConfig);

  try {
    // Check if the 'kana' database exists
    const [rows] = await tempDb.raw("SHOW DATABASES LIKE 'kana';");

    if (rows.length === 0) {
      return; // Exit early to skip migration
    }
  } finally {
    await tempDb.destroy(); // Close temporary connection
  }

  await insertSeasonLeagues(knex);
  await migrateCompanies();
  await migrateAlmostErrything();
  await migrateMatchesAndReservations();
  await migratePlayerStats();
  await migrateRanks();
  await migrateTrades();
  await teamLogosToCompanies();
  await cleanTeamsWithCascade();
  await experimentalTeamsIntoCompanies();

  await knex.raw("ALTER TABLE SeasonLeagues DROP old_kana_league_id;");
  await knex.raw("DROP DATABASE kana;");
}

// Rollback only if the 'kana' database exists, as we have got the data from the old database
export async function down(knex: Knex): Promise<void> {
  const baseDbConfig = {
    client: "mysql2",
    connection: {
      ...envConnection
    }
  };

  const knexi = require("knex");
  // Create a temporary connection without specifying a database
  const tempDb = knexi(baseDbConfig);

  try {
    // Check if the 'kana' database exists
    const [rows] = await tempDb.raw("SHOW DATABASES LIKE 'kana';");

    if (rows.length === 0) {
      return; // Exit early to skip migration
    }
  } finally {
    await tempDb.destroy(); // Close temporary connection
  }
  await knex.raw("DELETE FROM SeasonPlayerRanks");
  await knex.raw("DELETE FROM PlayerStats");
  await knex.raw("DELETE FROM PlayerTrades");
  await knex.raw("DELETE FROM TeamRosters");
  await knex.raw("DELETE FROM Matches");
  await knex.raw("DELETE FROM MatchReservations");
  await knex.raw("DELETE FROM Reservations");
  await knex.raw("DELETE FROM SeasonTeamPlayers");
  await knex.raw("DELETE FROM SteamPlayers");
  await knex.raw("DELETE FROM Matches");
  await knex.raw("DELETE FROM SeasonLeagueTeams");
  await knex.raw("DELETE FROM SeasonLeagues");
  await knex.raw("DELETE FROM SeasonTeamRegistrations");
  await knex.raw("DELETE FROM Teams");
  await knex.raw("DELETE FROM Organizations");
  await knex.raw("DELETE FROM Seasons");
  await knex.raw("DELETE FROM Leagues");
  await knex.raw("DELETE FROM Games");
}
