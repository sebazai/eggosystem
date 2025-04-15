import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TRIGGER update_account_updated_at
    BEFORE UPDATE ON Accounts
    FOR EACH ROW
    SET NEW.updated_at = NOW();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TRIGGER IF EXISTS update_account_updated_at;
  `);
}
