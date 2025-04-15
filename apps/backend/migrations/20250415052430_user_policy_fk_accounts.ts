import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("UserPolicyAcceptances", (table) => {
    table.dropForeign(["steam_id"]);
    table.dropUnique(["steam_id", "privacy_policy_version"]);
    table.dropColumn("steam_id");
  });

  await knex.schema.alterTable("UserPolicyAcceptances", (table) => {
    table
      .integer("account_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("Accounts")
      .onDelete("CASCADE");

    table.unique(["account_id", "privacy_policy_version"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("UserPolicyAcceptances", (table) => {
    table.dropForeign(["account_id"]);
    table.dropUnique(["account_id", "privacy_policy_version"]);
    table.dropColumn("account_id");
  });

  await knex.schema.alterTable("UserPolicyAcceptances", (table) => {
    table
      .bigInteger("steam_id")
      .notNullable()
      .references("steam_id")
      .inTable("SteamPlayers")
      .onDelete("CASCADE");

    table.unique(["steam_id", "privacy_policy_version"]);
  });
}
