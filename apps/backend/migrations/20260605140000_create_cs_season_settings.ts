import type { Knex } from "knex";

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("CSSeasonSettings", (table) => {
    table
      .integer("season_id")
      .unsigned()
      .primary()
      .references("id")
      .inTable("Seasons")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table.boolean("is_round_robin_bo2_as_2xbo1").notNullable().defaultTo(false);
    table.boolean("grand_final_round_one_only").notNullable().defaultTo(false);
    table.boolean("faceit_rank_required").notNullable().defaultTo(false);
    table.boolean("premier_rank_required").notNullable().defaultTo(false);
    table.boolean("hours_played_required").notNullable().defaultTo(false);
    table.timestamps(true, true);
  });

  await knex.raw(`
    INSERT INTO CSSeasonSettings (
      season_id,
      is_round_robin_bo2_as_2xbo1,
      grand_final_round_one_only,
      faceit_rank_required,
      premier_rank_required,
      hours_played_required
    )
    SELECT
      id,
      is_round_robin_bo2_as_2xbo1,
      COALESCE(grand_final_round_one_only, 0),
      faceit_rank_required,
      premier_rank_required,
      hours_played_required
    FROM Seasons
  `);

  await knex.schema.alterTable("Seasons", (table) => {
    table.dropColumn("is_round_robin_bo2_as_2xbo1");
    table.dropColumn("grand_final_round_one_only");
    table.dropColumn("faceit_rank_required");
    table.dropColumn("premier_rank_required");
    table.dropColumn("hours_played_required");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Seasons", (table) => {
    table.boolean("is_round_robin_bo2_as_2xbo1").notNullable().defaultTo(false);
    table.boolean("grand_final_round_one_only").defaultTo(false);
    table.boolean("faceit_rank_required").notNullable().defaultTo(false);
    table.boolean("premier_rank_required").notNullable().defaultTo(false);
    table.boolean("hours_played_required").notNullable().defaultTo(false);
  });

  await knex.raw(`
    UPDATE Seasons s
    JOIN CSSeasonSettings css ON css.season_id = s.id
    SET
      s.is_round_robin_bo2_as_2xbo1 = css.is_round_robin_bo2_as_2xbo1,
      s.grand_final_round_one_only  = css.grand_final_round_one_only,
      s.faceit_rank_required        = css.faceit_rank_required,
      s.premier_rank_required       = css.premier_rank_required,
      s.hours_played_required       = css.hours_played_required
  `);

  await knex.schema.dropTableIfExists("CSSeasonSettings");
}
