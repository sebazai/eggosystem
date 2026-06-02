import { type Knex } from "knex";

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("MapRoundStats", (table: Knex.TableBuilder) => {
    // Seconds into the round when the bomb was planted (null if no plant).
    table.decimal("plant_time", 18, 6).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("MapRoundStats", (table: Knex.TableBuilder) => {
    table.dropColumn("plant_time");
  });
}
