import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonPlayerRanks", (table) => {
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.string("ticket_id").nullable();
  });

  await knex.raw(`
    CREATE TRIGGER update_season_player_ranks_updated_at
    BEFORE UPDATE ON SeasonPlayerRanks
    FOR EACH ROW
    SET NEW.updated_at = NOW();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TRIGGER IF EXISTS update_season_player_ranks_updated_at;
  `);

  await knex.schema.alterTable("SeasonPlayerRanks", (table) => {
    table.dropColumn("created_at");
    table.dropColumn("updated_at");
    table.dropColumn("ticket_id");
  });
}
