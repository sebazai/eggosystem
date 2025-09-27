import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Seasons", (table) => {
    table.boolean("is_round_robin_bo2_as_2xbo1").defaultTo(false);
  });
  // Migrate SeasonLeagueExternalIds.isBO2PlayedAs2xBO1 to Seasons.is_round_robin_bo2_as_2xbo1
  const seasonLeagueExternalIds = await knex("SeasonLeagueExternalIds").select(
    "*"
  );
  for (const seasonLeagueExternalId of seasonLeagueExternalIds) {
    await knex("Seasons").where("id", seasonLeagueExternalId.season_id).update({
      is_round_robin_bo2_as_2xbo1: seasonLeagueExternalId.isBO2PlayedAs2xBO1
    });
  }
  // Drop column isBO2PlayedAs2xBO1 from SeasonLeagueExternalIds
  await knex.schema.alterTable("SeasonLeagueExternalIds", (table) => {
    table.dropColumn("isBO2PlayedAs2xBO1");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonLeagueExternalIds", (table) => {
    table.boolean("isBO2PlayedAs2xBO1").defaultTo(false);
  });
  const seasons = await knex("Seasons").select("*");
  for (const season of seasons) {
    await knex("SeasonLeagueExternalIds")
      .where("season_id", season.id)
      .update({ isBO2PlayedAs2xBO1: season.is_round_robin_bo2_as_2xbo1 });
  }
  await knex.schema.alterTable("Seasons", (table) => {
    table.dropColumn("is_round_robin_bo2_as_2xbo1");
  });
}
