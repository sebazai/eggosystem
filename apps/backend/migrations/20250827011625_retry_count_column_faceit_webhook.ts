import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("FaceitWebhooks", (table) => {
    table.integer("retry_count").defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("FaceitWebhooks", (table) => {
    table.dropColumn("retry_count");
  });
}
