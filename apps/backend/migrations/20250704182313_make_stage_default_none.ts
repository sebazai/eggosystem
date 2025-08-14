import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Ensure no NULLs exist (set to 1 or another valid stage id)
  await knex("Matches").whereNull("stage").update({ stage: 1 });

  // Drop the foreign key constraint first (if exists)
  await knex.schema.alterTable("Matches", (table) => {
    table.dropForeign(["stage"]);
  });
  // Alter the column to be NOT NULL and remove default
  await knex.schema.alterTable("Matches", (table) => {
    table.integer("stage").unsigned().notNullable().alter();
  });
  // Re-add the foreign key constraint (if needed)
  await knex.schema.alterTable("Matches", (table) => {
    table
      .foreign("stage")
      .references("id")
      .inTable("Stages")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop the foreign key constraint first
  await knex.schema.alterTable("Matches", (table) => {
    table.dropForeign(["stage"]);
  });
  // Revert to nullable and defaultTo(1)
  await knex.schema.alterTable("Matches", (table) => {
    table.integer("stage").unsigned().nullable().defaultTo(1).alter();
  });
  // Re-add the foreign key constraint
  await knex.schema.alterTable("Matches", (table) => {
    table
      .foreign("stage")
      .references("id")
      .inTable("Stages")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");
  });
}
