import { MatchGameStatus, MatchStatus } from "@eggosystem/types";
import type { Knex } from "knex";

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
  });
  await knex.schema.alterTable("MatchGames", (table) => {
    table.dropColumn("status");
  });
}
