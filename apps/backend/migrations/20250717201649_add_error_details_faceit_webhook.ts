import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("FaceitWebhooks", (table) => {
    table.text("error_details").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("FaceitWebhooks", (table) => {
    table.dropColumn("error_details");
  });
}
