import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add direct team FK to TeamGameScores (in addition to composite FK through MatchTeams)
  await knex.schema.table("TeamGameScores", (table) => {
    table
      .foreign("team_id")
      .references("id")
      .inTable("Teams")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });

  // Add direct team FK to MatchTeamMapVetoes
  await knex.schema.table("MatchTeamMapVetoes", (table) => {
    table
      .foreign("team_id")
      .references("id")
      .inTable("Teams")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("TeamGameScores", (table) => {
    table.dropForeign(["team_id"]);
  });

  await knex.schema.table("MatchTeamMapVetoes", (table) => {
    table.dropForeign(["team_id"]);
  });
}
