import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add unique constraint on (account_id, provider) to ensure one Discord link per account
  // This prevents multiple Discord links for the same account
  await knex.schema.alterTable("LinkedAccounts", (table) => {
    table.unique(["account_id", "provider"]);
  });

  // Migrate existing Accounts.discord values to LinkedAccounts as fake rows
  // Only create fake rows for accounts that:
  // 1. Have a discord value in Accounts table
  // 2. Don't already have any Discord LinkedAccount (valid or fake)
  // For fake rows, we'll use a special provider_id format: "fake_{account_id}"
  // This allows us to maintain the primary key constraint while distinguishing fake rows
  await knex.raw(`
    INSERT INTO LinkedAccounts (account_id, provider, provider_id, provider_username)
    SELECT 
      a.id as account_id,
      'discord' as provider,
      CONCAT('fake_', a.id) as provider_id,
      a.discord as provider_username
    FROM Accounts a
    WHERE a.discord IS NOT NULL 
      AND a.discord != ''
      AND NOT EXISTS (
        SELECT 1 
        FROM LinkedAccounts la 
        WHERE la.account_id = a.id 
          AND la.provider = 'discord'
      )
  `);

  // Drop discord column from Accounts table
  await knex.schema.alterTable("Accounts", (table) => {
    table.dropColumn("discord");
  });
}

export async function down(knex: Knex): Promise<void> {
  // Re-add discord column to Accounts table
  await knex.schema.alterTable("Accounts", (table) => {
    table.string("discord", 255).nullable();
  });

  // Restore discord values from LinkedAccounts (only from valid OAuth links with provider_id)
  await knex.raw(`
    UPDATE Accounts a
    INNER JOIN LinkedAccounts la ON la.account_id = a.id
    SET a.discord = la.provider_username
    WHERE la.provider = 'discord' 
      AND la.provider_id IS NOT NULL
      AND la.provider_username IS NOT NULL
  `);

  // Delete fake Discord LinkedAccounts rows (those with provider_id starting with 'fake_')
  await knex("LinkedAccounts")
    .where("provider", "discord")
    .where("provider_id", "like", "fake_%")
    .del();

  // Remove the unique constraint on (account_id, provider)
  await knex.schema.alterTable("LinkedAccounts", (table) => {
    table.dropUnique(["account_id", "provider"]);
  });
}
