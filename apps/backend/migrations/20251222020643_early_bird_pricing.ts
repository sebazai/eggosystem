import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("Seasons", (table: Knex.TableBuilder) => {
    table.decimal("early_bird_price_discount", 10, 2).nullable();
    table.timestamp("early_bird_price_discount_end_date").nullable();
  });
  await knex("Seasons").where("id", 17).update({
    early_bird_price_discount: 0.2,
    early_bird_price_discount_end_date: "2026-01-04 21:59:59"
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("Seasons", (table: Knex.TableBuilder) => {
    table.dropColumn("early_bird_price_discount");
    table.dropColumn("early_bird_price_discount_end_date");
  });
}
