import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // List of tables to add timestamps to
  const tables = [
    "Matches",
    "MatchGameClips",
    "MatchGames",
    "Reservations",
    "SeasonLeagueExternalIds",
    "SeasonLeagues",
    "SeasonLeagueTeams",
    "Seasons",
    "SeasonTeamPlayers",
    "SeasonTeamRegistrationPlayers",
    "SeasonTeamRegistrations",
    "SteamPlayerKanaElo",
    "TeamRosters",
    "Teams"
  ];

  // Add created_at and updated_at columns to each table
  for (const tableName of tables) {
    await knex.schema.alterTable(tableName, (table) => {
      table.timestamps(true, true); // Adds created_at and updated_at
    });
  }

  // Set default value for Matches status field
  await knex.schema.alterTable("Matches", (table) => {
    table
      .enum("status", [
        "SCHEDULED",
        "CHECK_IN",
        "VOTING",
        "CONFIGURING",
        "READY",
        "ONGOING",
        "FINISHED",
        "ABORTED",
        "CANCELLED",
        "FORFEIT",
        "PAUSED"
      ])
      .notNullable()
      .defaultTo("SCHEDULED")
      .alter();
  });

  // Create triggers for automatic updated_at updates
  const triggerPromises = tables.map((tableName) =>
    knex.raw(`
      CREATE TRIGGER update_${tableName.toLowerCase()}_updated_at
      BEFORE UPDATE ON ${tableName}
      FOR EACH ROW
      SET NEW.updated_at = NOW();
    `)
  );

  await Promise.all(triggerPromises);
}

export async function down(knex: Knex): Promise<void> {
  // List of tables to remove timestamps from
  const tables = [
    "Matches",
    "MatchGameClips",
    "MatchGames",
    "Reservations",
    "SeasonLeagueExternalIds",
    "SeasonLeagues",
    "SeasonLeagueTeams",
    "Seasons",
    "SeasonTeamPlayers",
    "SeasonTeamRegistrationPlayers",
    "SeasonTeamRegistrations",
    "SteamPlayerKanaElo",
    "TeamRosters",
    "Teams"
  ];

  // Drop triggers first
  const dropTriggerPromises = tables.map((tableName) =>
    knex.raw(`
      DROP TRIGGER IF EXISTS update_${tableName.toLowerCase()}_updated_at;
    `)
  );

  await Promise.all(dropTriggerPromises);

  // Revert Matches status field to previous state (nullable with null default)
  await knex.schema.alterTable("Matches", (table) => {
    table
      .enum("status", [
        "SCHEDULED",
        "CHECK_IN",
        "VOTING",
        "CONFIGURING",
        "READY",
        "ONGOING",
        "FINISHED",
        "ABORTED",
        "CANCELLED",
        "FORFEIT",
        "PAUSED"
      ])
      .nullable()
      .defaultTo(null)
      .alter();
  });

  // Remove created_at and updated_at columns from each table
  for (const tableName of tables) {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropTimestamps();
    });
  }
}
