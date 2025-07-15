import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("FaceitWebhooks", (table) => {
    table.increments("id").primary();
    table.timestamp("received_at").defaultTo(knex.fn.now()).notNullable();
    table.string("external_match_room_id").notNullable();
    table.string("event").notNullable();
    table.text("data").notNullable();
    table.text("details").notNullable();
    table.string("error_type").defaultTo(null).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("FaceitWebhooks");
}
