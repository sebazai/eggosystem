import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Seasons", (table) => {
    table
      .integer("organizer_id")
      .after("game_type_id")
      .unsigned()
      .notNullable()
      .defaultTo(1);
    table
      .foreign("organizer_id")
      .references("id")
      .inTable("Organizers")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Seasons", (table) => {
    table.dropForeign("organizer_id");
    table.dropColumn("organizer_id");
  });
}
