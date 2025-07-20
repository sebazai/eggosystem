import type { Knex } from "knex";

enum MatchStatus {
  CREATED = "CREATED",
  VOTING = "VOTING",
  ONGOING = "ONGOING",
  FINISHED = "FINISHED",
  ABORTED = "ABORTED",
  CANCELLED = "CANCELLED"
}

enum MatchGameStatus {
  CREATED = "CREATED",
  CONFIGURING = "CONFIGURING",
  READY = "READY",
  ONGOING = "ONGOING",
  FINISHED = "FINISHED",
  ABORTED = "ABORTED",
  CANCELLED = "CANCELLED"
}

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Matches", (table) => {
    table
      .enum("status", [
        MatchStatus.CREATED,
        MatchStatus.VOTING,
        MatchStatus.ONGOING,
        MatchStatus.FINISHED,
        MatchStatus.ABORTED,
        MatchStatus.CANCELLED
      ])
      .defaultTo(MatchStatus.CREATED);
    table.tinyint("group").nullable().defaultTo(null);
    table.tinyint("round").nullable().defaultTo(null);
  });
  await knex.schema.alterTable("MatchGames", (table) => {
    table
      .enum("status", [
        MatchGameStatus.CREATED,
        MatchGameStatus.ONGOING,
        MatchGameStatus.FINISHED,
        MatchGameStatus.ABORTED,
        MatchGameStatus.CANCELLED
      ])
      .defaultTo(MatchGameStatus.CREATED);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Matches", (table) => {
    table.dropColumn("status");
    table.dropColumn("group");
    table.dropColumn("round");
  });
  await knex.schema.alterTable("MatchGames", (table) => {
    table.dropColumn("status");
  });
}
