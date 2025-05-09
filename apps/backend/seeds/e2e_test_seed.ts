import { type Knex } from "knex";

/**
 * E2E Test Seed
 *
 * This seed file is specifically for E2E testing. It creates a new season
 * with the specified parameters.
 */
export async function seed(knex: Knex): Promise<void> {
  try {
    // Create new Season 4
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tenDaysLater = new Date(now);
    tenDaysLater.setDate(tenDaysLater.getDate() + 10);

    const sixtyDaysLater = new Date(now);
    sixtyDaysLater.setDate(sixtyDaysLater.getDate() + 60);

    await knex("Seasons").insert({
      id: 16,
      game_id: 1,
      name: "Season 4",
      full_name: "CS2 Season 4",
      signup_start_date: now,
      signup_end_date: tomorrow,
      start_date: tenDaysLater,
      end_date: sixtyDaysLater,
      platform: "faceit"
    });

    // Update user emails in the Accounts table
    const users = [{ id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 8 }];

    for (const user of users) {
      // Update the user's email and set work_email_verified to 1
      await knex("Accounts")
        .where({ id: user.id })
        .update({
          work_email: `test+${user.id}@kanaliiga.fi`,
          work_email_verified: 1
        });

      // Insert or update UserPolicyAcceptances using raw query with ON DUPLICATE KEY UPDATE
      await knex.raw(
        `
        INSERT INTO UserPolicyAcceptances 
          (account_id, accepted_privacy_policy, accepted_marketing, privacy_policy_version)
        VALUES 
          (?, 1, 0, '1')
        ON DUPLICATE KEY UPDATE 
          accepted_privacy_policy = 1
      `,
        [user.id]
      );
    }
  } catch (error) {
    console.error("Error running E2E test seed:", error);
    throw error;
  }
}
