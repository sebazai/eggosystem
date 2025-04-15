import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create Accounts and LinkedAccounts tables
  await knex.schema
    .createTable("Accounts", function (table) {
      table.increments("id").primary().unsigned();
      table.string("email").unique();
      table.string("work_email").unique();
      table.string("full_name");
      table.string("discord");
      table.timestamps(true, true);
    })
    .createTable("LinkedAccounts", function (table) {
      table.integer("account_id").unsigned().notNullable();
      table.enu("provider", ["steam"]).notNullable();
      table.string("provider_id", 255).notNullable();
      table.primary(["provider", "provider_id"]);
      table
        .foreign("account_id")
        .references("id")
        .inTable("Accounts")
        .onDelete("CASCADE");
    });

  // Add account_id foreign key to SteamPlayers table
  await knex.schema.table("SteamPlayers", function (table) {
    table.integer("account_id").unsigned().nullable();
    table
      .foreign("account_id")
      .references("id")
      .inTable("Accounts")
      .onDelete("CASCADE");
  });

  // Insert new accounts for each player and link them with Steam data
  const players = await knex("SteamPlayers").select(
    "steam_id",
    "email",
    "work_email",
    "discord",
    "full_name"
  );

  for (const player of players) {
    const [accountId] = await knex("Accounts").insert({
      work_email: player.work_email || null,
      email: player.email || null,
      discord: player.discord || null,
      full_name: player.full_name || null,
      created_at: knex.fn.now()
    });

    await knex("SteamPlayers")
      .where("steam_id", player.steam_id)
      .update({ account_id: accountId });

    await knex("LinkedAccounts").insert({
      account_id: accountId,
      provider: "steam",
      provider_id: String(player.steam_id)
    });
  }
  return knex.schema.table("SteamPlayers", function (table) {
    table.integer("account_id").unsigned().notNullable().alter();
    table.dropColumn("email");
    table.dropColumn("work_email");
    table.dropColumn("discord");
    table.dropColumn("full_name");
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop the foreign key and column for account_id in SteamPlayers
  await knex.schema.table("SteamPlayers", function (table) {
    table.dropForeign("account_id");
    table.dropColumn("account_id");
    table.string("email");
    table.string("work_email");
    table.string("discord");
    table.string("full_name");
  });

  // Drop the LinkedAccounts and Accounts tables
  return knex.schema
    .dropTableIfExists("LinkedAccounts")
    .dropTableIfExists("Accounts");
}
