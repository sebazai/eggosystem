import type { Knex } from "knex";

enum MatchStatus {
  SCHEDULED = "SCHEDULED",
  CHECK_IN = "CHECK_IN",
  VOTING = "VOTING",
  CONFIGURING = "CONFIGURING",
  READY = "READY",
  ONGOING = "ONGOING",
  FINISHED = "FINISHED",
  ABORTED = "ABORTED",
  CANCELLED = "CANCELLED",
  FORFEIT = "FORFEIT"
}

export async function up(knex: Knex): Promise<void> {
  // Update Matches table status enum
  await knex.schema.alterTable("Matches", (table) => {
    // Drop the existing status column
    table.dropColumn("status");
  });

  await knex.schema.alterTable("Matches", (table) => {
    // Add the new status column with all possible statuses
    table
      .enum("status", [
        MatchStatus.SCHEDULED,
        MatchStatus.CHECK_IN,
        MatchStatus.VOTING,
        MatchStatus.CONFIGURING,
        MatchStatus.READY,
        MatchStatus.ONGOING,
        MatchStatus.FINISHED,
        MatchStatus.ABORTED,
        MatchStatus.CANCELLED,
        MatchStatus.FORFEIT
      ])
      .nullable()
      .defaultTo(null);
  });

  // Update MatchGames table status enum
  await knex.schema.alterTable("MatchGames", (table) => {
    // Drop the existing status column
    table.dropColumn("status");
  });
}

export async function down(knex: Knex): Promise<void> {
  // Revert MatchGames table
  await knex.schema.alterTable("MatchGames", (table) => {
    table.dropColumn("status");
  });

  await knex.schema.alterTable("MatchGames", (table) => {
    table
      .enum("status", [
        "CREATED",
        "ONGOING",
        "FINISHED",
        "ABORTED",
        "CANCELLED"
      ])
      .defaultTo("CREATED");
  });

  // Revert Matches table
  await knex.schema.alterTable("Matches", (table) => {
    table.dropColumn("status");
  });

  await knex.schema.alterTable("Matches", (table) => {
    table
      .enum("status", [
        "CREATED",
        "VOTING",
        "ONGOING",
        "FINISHED",
        "ABORTED",
        "CANCELLED"
      ])
      .defaultTo("CREATED");
  });
}
