import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("UserPolicyAcceptances", (table) => {
    table.increments("id").primary();
    table.bigint("steam_id").notNullable();
    table.boolean("accepted_privacy_policy").notNullable().defaultTo(false);
    table.boolean("accepted_marketing").notNullable().defaultTo(false);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.string("privacy_policy_version").notNullable().defaultTo("1");
    table
      .foreign("steam_id")
      .references("steam_id")
      .inTable("Players")
      .onDelete("CASCADE");

    table.unique(["steam_id", "privacy_policy_version"]);
  });
  await knex.raw(`
    CREATE TRIGGER update_user_policy_acceptances_updated_at
    BEFORE UPDATE ON UserPolicyAcceptances
    FOR EACH ROW
    SET NEW.updated_at = NOW();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TRIGGER IF EXISTS update_user_policy_acceptances_updated_at;
  `);
  await knex.schema.dropTableIfExists("UserPolicyAcceptances");
}
