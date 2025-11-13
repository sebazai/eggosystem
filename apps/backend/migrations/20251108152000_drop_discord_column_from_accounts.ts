import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Step 1: Convert all existing Discord OAuth links to fake rows
  // This ensures everyone needs to re-link via OAuth, which will now save the username
  // We preserve any existing provider_username if it exists
  // We use a temporary table approach to handle the primary key constraint
  await knex.raw(`
    CREATE TEMPORARY TABLE temp_discord_links AS
    SELECT 
      account_id,
      provider,
      CONCAT('fake_', account_id) as provider_id,
      provider_username
    FROM LinkedAccounts
    WHERE provider = 'discord' 
      AND provider_id IS NOT NULL 
      AND provider_id NOT LIKE 'fake_%'
  `);

  // Delete the old OAuth links
  await knex.raw(`
    DELETE FROM LinkedAccounts
    WHERE provider = 'discord' 
      AND provider_id IS NOT NULL 
      AND provider_id NOT LIKE 'fake_%'
  `);

  // Insert the fake rows
  await knex.raw(`
    INSERT INTO LinkedAccounts (account_id, provider, provider_id, provider_username)
    SELECT account_id, provider, provider_id, provider_username
    FROM temp_discord_links
  `);

  // Drop temporary table
  await knex.raw(`DROP TEMPORARY TABLE temp_discord_links`);

  // Add unique constraint on (account_id, provider) to ensure one Discord link per account
  // This prevents multiple Discord links for the same account
  await knex.schema.alterTable("LinkedAccounts", (table) => {
    table.unique(["account_id", "provider"]);
  });

  // Step 2: Migrate existing Accounts.discord values to LinkedAccounts as fake rows
  // Only create fake rows for accounts that:
  // 1. Have a discord value in Accounts table
  // 2. Don't already have any Discord LinkedAccount (valid or fake)
  // If they already have a fake row from Step 1, we'll update the username if Accounts.discord exists
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
    ON DUPLICATE KEY UPDATE 
      provider_username = COALESCE(VALUES(provider_username), LinkedAccounts.provider_username)
  `);

  // Step 3: Update fake rows to use Accounts.discord username if it exists and is better
  // This ensures we preserve the username from Accounts.discord if it's available
  await knex.raw(`
    UPDATE LinkedAccounts la
    INNER JOIN Accounts a ON la.account_id = a.id
    SET la.provider_username = a.discord
    WHERE la.provider = 'discord'
      AND la.provider_id LIKE 'fake_%'
      AND a.discord IS NOT NULL
      AND a.discord != ''
      AND (la.provider_username IS NULL OR la.provider_username = '')
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
