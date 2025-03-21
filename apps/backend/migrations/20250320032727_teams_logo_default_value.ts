import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // set Teams table team_logo default value to "nologo.svg"
  await knex.schema.alterTable("Teams", (table) => {
    table.string("team_logo").notNullable().defaultTo("nologo.svg").alter();
    // set name to be unique
    table.unique("name");
  });
}

export async function down(knex: Knex): Promise<void> {
  // revert Teams table team_logo default value to null
  await knex.schema.alterTable("Teams", (table) => {
    table.string("team_logo").nullable().defaultTo(null).alter();
    // remove unique constraint from name
    table.dropUnique(["name"]);
  });
}
