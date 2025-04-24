import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("AccountPermissionScopes", function (table) {
    table.increments("id").primary().unsigned();
    table.integer("account_id").unsigned().notNullable();
    table.integer("permission_id").unsigned().notNullable();
    table.integer("season_id").unsigned().notNullable();
    table.integer("team_id").unsigned().notNullable();
    table.timestamps(true, true);
    table
      .foreign("account_id")
      .references("id")
      .inTable("Accounts")
      .onDelete("CASCADE");
    table
      .foreign("permission_id")
      .references("id")
      .inTable("Permissions")
      .onDelete("CASCADE");
    table
      .foreign("season_id")
      .references("id")
      .inTable("Seasons")
      .onDelete("CASCADE");
    table
      .foreign("team_id")
      .references("id")
      .inTable("Teams")
      .onDelete("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("AccountPermissionScopes");
}
