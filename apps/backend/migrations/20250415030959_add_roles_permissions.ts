import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .createTable("Roles", function (table) {
      table.increments("id").unsigned().primary();
      table.string("role_name").unique().notNullable();
      table.timestamps(true, true);
    })
    .createTable("Permissions", function (table) {
      table.increments("id").unsigned().primary();
      table.string("permission_name").unique().notNullable(); // e.g., update:player
      table.timestamps(true, true);
    })
    .createTable("RolePermissions", function (table) {
      table
        .integer("role_id")
        .unsigned()
        .references("id")
        .inTable("Roles")
        .onDelete("CASCADE");
      table
        .integer("permission_id")
        .unsigned()
        .references("id")
        .inTable("Permissions")
        .onDelete("CASCADE");
      table.primary(["role_id", "permission_id"]);
      table.timestamps(true, true);
    })
    .createTable("AccountRoles", function (table) {
      table
        .integer("account_id")
        .unsigned()
        .references("id")
        .inTable("Accounts")
        .onDelete("CASCADE");
      table
        .integer("role_id")
        .unsigned()
        .references("id")
        .inTable("Roles")
        .onDelete("CASCADE");
      table
        .integer("game_id")
        .unsigned()
        .references("id")
        .inTable("Games")
        .onDelete("CASCADE");
      table.primary(["account_id", "role_id", "game_id"]);
      table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .dropTableIfExists("AccountRoles")
    .dropTableIfExists("RolePermissions")
    .dropTableIfExists("Permissions")
    .dropTableIfExists("Roles");
}
