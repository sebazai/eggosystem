import { type Knex } from "knex";
import { type SeasonPlayerRank } from "@eggosystem/types";

/**
 * E2E Test Seed
 *
 * This seed file is specifically for E2E testing. It creates a new season
 * with the specified parameters.
 */
export async function seed(knex: Knex): Promise<void> {
  // Get privacy policy version from environment variable (same as backend uses)
  const privacyPolicyVersion = process.env.PRIVACY_POLICY_VERSION || "1";

  // Define test Steam IDs that E2E tests will use
  const testSteamIds = [
    "76561197960273207", // account_id 3 - Aabe
    "76561197960283932", // account_id 4 - heppajpg (JWT user)
    "76561197960275646", // account_id 5 - Quattra
    "76561197960283671", // account_id 6 - Trev
    "76561197960265728", // account_id 8 - Hoolyz
    "76561197960265740", // account_id 9 - RealPlayer1
    "76561197961279983", // account_id 10 - RealPlayer2
    "76561197960265748", // account_id 11 - RealPlayer3
    "76561197967885016", // account_id 1 - PrivateProfilePlayer
    "76561197960269868", // account_id 2 - InsufficientHoursPlayer
    "76561197967885016", // account_id 1 - PrivateProfilePlayer (handled by steamApiService mock)
    "76561197960269868", // account_id 2 - InsufficientHoursPlayer (handled by steamApiService mock)
    "76561197960280001", // account_id 12 - IncompleteDetailsPlayer (invalid /details data from DB)
    "76561197960280002" // account_id 13 - RaceConditionPlayer (handled by steamApiService mock)
  ];

  // Clean up team 2263 specifically - this team contains conflicting Steam IDs from regular seed
  await knex("SeasonTeamPlayers").where({ team_id: 2263 }).del();
  await knex("SeasonTeamRegistrations").where({ team_id: 2263 }).del();

  // Clean up ALL existing registrations for test Steam IDs (not just season 16)
  for (const steamId of testSteamIds) {
    // Delete from SeasonTeamPlayers for ALL seasons (not just season 16)
    await knex("SeasonTeamPlayers").where({ steam_id: steamId }).del();

    // remove all manual approvals
    await knex("SeasonPlayerApprovals").where({ steam_id: steamId }).del();

    // Delete from SeasonTeamRegistrations where this player is captain or co-captain
    await knex("SeasonTeamRegistrations")
      .where({ captain_steam_id: steamId })
      .orWhere({ co_captain_steam_id: steamId })
      .del();
  }

  // Clean up existing E2E test data
  await knex("AccountPermissionScopes")
    .where({ season_id: 16, team_id: 999 })
    .del();
  await knex("AccountRoles").where({ account_id: 3, game_id: 1 }).del();
  await knex("SeasonTeamPlayers").where({ season_id: 16 }).del();
  await knex("SeasonTeamRegistrations").where({ season_id: 16 }).del();
  await knex("Teams").where({ id: 999 }).del();
  await knex("Organizations").where({ id: 999 }).del();
  await knex("Seasons").where({ id: 16 }).del();

  // Clean up test accounts and related data if they exist
  const testAccountIds = [3, 4, 5, 6, 8, 9, 10, 11, 12, 13];
  for (const accountId of testAccountIds) {
    await knex("LinkedAccounts").where({ account_id: accountId }).del();
    await knex("UserPolicyAcceptances").where({ account_id: accountId }).del();
    await knex("SteamPlayers").where({ account_id: accountId }).del();
    // Note: We don't delete from Accounts as they might be needed for other tests
  }

  // Clean up organizations that might be created during E2E tests by name
  // This prevents "Duplicate entry 'Success Message Test Org' for key 'organizations_name_unique'" errors
  const testOrgNames = [
    "E2E Test Organization",
    "Success Message Test Org",
    "Submission Test Org",
    "Test Organization",
    "Test Org"
  ];

  for (const orgName of testOrgNames) {
    await knex("Organizations").where({ name: orgName }).del();
  }

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
  const users = [
    { id: 1 },
    { id: 2 },
    { id: 3 },
    { id: 4 },
    { id: 5 },
    { id: 6 },
    { id: 8 },
    { id: 9 },
    { id: 10 },
    { id: 11 },
    { id: 12 },
    { id: 13 }
  ];

  for (const user of users) {
    // Update the user's email and set work_email_verified to 1
    await knex("Accounts")
      .where({ id: user.id })
      .update({
        work_email: `test+${user.id}@kanaliiga.fi`,
        work_email_verified: 1
      });

    // Special handling for IncompleteDetailsPlayer (account_id 12)
    if (user.id === 12) {
      // Set up incomplete/invalid data for testing
      await knex("Accounts").where({ id: user.id }).update({
        work_email: null, // Missing work email
        work_email_verified: 0, // Not verified
        full_name: "IncompletePlayer" // Missing space - invalid full name
      });
    } else {
      // Update the user's email and set work_email_verified to 1 for all others
      await knex("Accounts")
        .where({ id: user.id })
        .update({
          work_email: `test+${user.id}@kanaliiga.fi`,
          work_email_verified: 1
        });
    }

    // Insert or update UserPolicyAcceptances using raw query with ON DUPLICATE KEY UPDATE
    // Use the same privacy policy version that the backend expects
    if (user.id === 12) {
      // IncompleteDetailsPlayer - set up incomplete privacy policy acceptance
      await knex.raw(
        `
        INSERT INTO UserPolicyAcceptances 
          (account_id, accepted_privacy_policy, accepted_marketing, privacy_policy_version)
        VALUES 
          (?, 0, 0, 'old_version')
        ON DUPLICATE KEY UPDATE 
          accepted_privacy_policy = 0,
          privacy_policy_version = 'old_version'
      `,
        [user.id]
      );
    } else {
      await knex.raw(
        `
        INSERT INTO UserPolicyAcceptances 
          (account_id, accepted_privacy_policy, accepted_marketing, privacy_policy_version)
        VALUES 
          (?, 1, 0, ?)
        ON DUPLICATE KEY UPDATE 
          accepted_privacy_policy = 1,
          privacy_policy_version = VALUES(privacy_policy_version)
      `,
        [user.id, privacyPolicyVersion]
      );
    }
  }

  // Add email verification test tokens for E2E testing
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

  const expiredDate = new Date();
  expiredDate.setDate(expiredDate.getDate() - 1); // 1 day ago

  // Create multiple test accounts with valid tokens for E2E testing
  // This prevents test isolation issues where successful verification consumes tokens
  const validTokenAccounts = [
    { id: 100, token: "valid-token-123", email: "emailtest1@kanaliiga.fi" },
    { id: 102, token: "valid-token-456", email: "emailtest2@kanaliiga.fi" },
    { id: 103, token: "valid-token-789", email: "emailtest3@kanaliiga.fi" },
    { id: 104, token: "valid-token-abc", email: "emailtest4@kanaliiga.fi" },
    { id: 105, token: "valid-token-def", email: "emailtest5@kanaliiga.fi" }
  ];

  for (const account of validTokenAccounts) {
    await knex.raw(
      `
      INSERT INTO Accounts (id, full_name, work_email, work_email_verified, work_email_token, work_email_token_expires_at)
      VALUES (?, ?, ?, 0, ?, ?)
      ON DUPLICATE KEY UPDATE 
        full_name = VALUES(full_name),
        work_email = VALUES(work_email),
        work_email_verified = 0,
        work_email_token = VALUES(work_email_token),
        work_email_token_expires_at = VALUES(work_email_token_expires_at)
    `,
      [
        account.id,
        `Email Test User ${account.id}`,
        account.email,
        account.token,
        futureDate
      ]
    );
  }

  // Create another test account with expired token
  await knex.raw(
    `
    INSERT INTO Accounts (id, full_name, work_email, work_email_verified, work_email_token, work_email_token_expires_at)
    VALUES (101, 'Expired Token User', 'expired@kanaliiga.fi', 0, 'expired-token-456', ?)
    ON DUPLICATE KEY UPDATE 
      full_name = VALUES(full_name),
      work_email = VALUES(work_email),
      work_email_verified = 0,
      work_email_token = VALUES(work_email_token),
      work_email_token_expires_at = VALUES(work_email_token_expires_at)
  `,
    [expiredDate]
  );

  // Add UserPolicyAcceptances for all the test accounts
  const allTestAccountIds = [...validTokenAccounts.map((a) => a.id), 101];
  for (const accountId of allTestAccountIds) {
    await knex.raw(
      `
      INSERT INTO UserPolicyAcceptances 
        (account_id, accepted_privacy_policy, accepted_marketing, privacy_policy_version)
      VALUES 
        (?, 1, 0, ?)
      ON DUPLICATE KEY UPDATE 
        accepted_privacy_policy = 1,
        privacy_policy_version = VALUES(privacy_policy_version)
    `,
      [accountId, privacyPolicyVersion]
    );
  }

  // Ensure we have SteamPlayers for the accounts we need
  // This creates the missing accounts and steam players
  const steamPlayerData = [
    { account_id: 3, steam_id: "76561197960273207", nickname: "Aabe" },
    { account_id: 4, steam_id: "76561197960283932", nickname: "heppajpg" },
    {
      account_id: 5,
      steam_id: "76561197960275646",
      nickname: "Quattra",
      work_email: "test+5@kanaliiga.fi",
      work_email_verified: 1,
      is_work_email_personal_email: true
    },
    {
      account_id: 6,
      steam_id: "76561197960283671",
      nickname: "Trev",
      work_email_verified: 0
    },
    { account_id: 8, steam_id: "76561197960265728", nickname: "Hoolyz" }, // Robin Walker (Valve employee) - guaranteed public
    // Add well-known public Steam accounts for testing
    { account_id: 9, steam_id: "76561197960265740", nickname: "RealPlayer1" }, // Another Valve account - guaranteed public
    { account_id: 10, steam_id: "76561197961279983", nickname: "RealPlayer2" }, // Well-known public Steam ID
    { account_id: 11, steam_id: "76561197960265748", nickname: "RealPlayer3" }, // Another Valve account - guaranteed public
    // Add Steam IDs for error testing (from dev seed)
    {
      account_id: 1,
      steam_id: "76561197967885016",
      nickname: "PrivateProfilePlayer"
    }, // For private profile test
    {
      account_id: 2,
      steam_id: "76561197960269868",
      nickname: "InsufficientHoursPlayer"
    }, // For insufficient hours test
    {
      account_id: 12,
      steam_id: "76561197960280001",
      nickname: "IncompleteDetailsPlayer"
    }, // For incomplete /details API test
    {
      account_id: 13,
      steam_id: "76561197960280002",
      nickname: "RaceConditionPlayer"
    } // For race condition testing
  ];

  for (const player of steamPlayerData) {
    // Insert account if it doesn't exist
    await knex.raw(
      `
      INSERT INTO Accounts (id, full_name, work_email, work_email_verified, is_work_email_personal_email)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        work_email = VALUES(work_email),
        work_email_verified = VALUES(work_email_verified),
        is_work_email_personal_email = VALUES(is_work_email_personal_email)
    `,
      [
        player.account_id,
        player.nickname,
        player.work_email ?? `test+${player.account_id}@kanaliiga.fi`,
        player.work_email_verified ?? 1,
        player.is_work_email_personal_email ?? 0
      ]
    );

    // Insert SteamPlayer if it doesn't exist
    await knex.raw(
      `
      INSERT INTO SteamPlayers (account_id, steam_id, nickname)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        nickname = VALUES(nickname)
    `,
      [player.account_id, player.steam_id, player.nickname]
    );

    // Insert LinkedAccount if it doesn't exist
    await knex.raw(
      `
      INSERT INTO LinkedAccounts (account_id, provider_id, provider)
      VALUES (?, ?, 'steam')
      ON DUPLICATE KEY UPDATE 
        account_id = VALUES(account_id)
    `,
      [player.account_id, player.steam_id]
    );
  }

  // Create a test team for registration testing
  await knex("Organizations").insert({
    id: 999,
    name: "E2E Test Organization",
    organization_code: "2992559-2",
    website: "https://kanaliiga.fi"
  });

  await knex("Teams").insert({
    id: 999,
    name: "E2E Test Team",
    organization_id: 999,
    org_approved: true
  });

  // Create a season team registration record (required by foreign key constraint)
  await knex("SeasonTeamRegistrations").insert({
    season_id: 16,
    team_id: 999,
    captain_steam_id: "76561197960273207",
    co_captain_steam_id: null,
    external_platform_id: "77dd9104-d2f1-4f50-ba80-d58457cff5a9",
    terms_and_conditions_approved: true
  });

  // Set up SeasonTeamPlayers for employment approval testing
  const seasonTeamPlayers = [
    // account_id 5 (76561197960275646) - approve manually for testing organizer approval
    {
      season_id: 16,
      team_id: 999,
      steam_id: "76561197960275646"
    }
  ];

  // Insert SeasonTeamPlayers records
  for (const player of seasonTeamPlayers) {
    await knex.raw(
      `
      INSERT INTO SeasonPlayerApprovals
        (season_id, steam_id, team_id)
      VALUES
        (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        team_id = VALUES(team_id)
    `,
      [player.season_id, player.steam_id, player.team_id]
    );
  }

  // Set account_id 6 to have personal email to test organizer approval workflow
  await knex("Accounts").where({ id: 6 }).update({
    work_email: "personal.email@gmail.com",
    work_email_verified: 1,
    is_work_email_personal_email: true
  });

  // Set up captain permissions for account_id 3 (the auth user)
  // First ensure the captain role exists
  await knex.raw(
    `
    INSERT INTO Roles (role_name)
    VALUES ('captain')
    ON DUPLICATE KEY UPDATE role_name = VALUES(role_name)
  `
  );

  // Ensure the edit-registration permission exists
  await knex.raw(
    `
    INSERT INTO Permissions (permission_name)
    VALUES ('edit-registration')
    ON DUPLICATE KEY UPDATE permission_name = VALUES(permission_name)
  `
  );

  // Add captain role to account_id 3
  await knex.raw(
    `
    INSERT INTO AccountRoles (account_id, role_id, game_id)
    SELECT 3, r.id, 1
    FROM Roles r
    WHERE r.role_name = 'captain'
    ON DUPLICATE KEY UPDATE account_id = VALUES(account_id)
  `
  );

  // Add edit-registration permission scope for season 16, team 999 to account_id 3
  await knex.raw(
    `
    INSERT INTO AccountPermissionScopes (account_id, permission_id, season_id, team_id)
    SELECT 3, p.id, 16, 999
    FROM Permissions p
    WHERE p.permission_name = 'edit-registration'
    ON DUPLICATE KEY UPDATE account_id = VALUES(account_id)
  `
  );

  // Add SeasonPlayerRanks data for our test players
  // This ensures backend validation passes during submission
  const playerRanksData = [
    {
      steam_id: "76561197960283932",
      season_id: 16,
      cs_hours: 1500,
      cs2_rank: 15,
      faceit_elo: 1500,
      faceit_level: 10,
      faceit_kd: 1.5
    }, // account_id 4 - heppajpg
    {
      steam_id: "76561197960265728",
      season_id: 16,
      cs_hours: 2000,
      cs2_rank: 18,
      faceit_elo: 1500,
      faceit_level: 10,
      faceit_kd: 1.5
    }, // account_id 8 - Hoolyz (Robin Walker)
    {
      steam_id: "76561197960265740",
      season_id: 16,
      cs_hours: 1800,
      cs2_rank: 12,
      faceit_elo: 1500,
      faceit_level: 10,
      faceit_kd: 1.5
    }, // account_id 9 - RealPlayer1 (Valve)
    {
      steam_id: "76561197961279983",
      season_id: 16,
      cs_hours: 1600,
      cs2_rank: 14,
      faceit_elo: 1500,
      faceit_level: 10,
      faceit_kd: 1.5
    }, // account_id 10 - RealPlayer2
    {
      steam_id: "76561197960265748",
      season_id: 16,
      cs_hours: 1700,
      cs2_rank: 16,
      faceit_elo: 1500,
      faceit_level: 10,
      faceit_kd: 1.5
    }, // account_id 11 - RealPlayer3 (Valve)
    {
      steam_id: "76561197960273207",
      season_id: 16,
      cs_hours: 2200,
      cs2_rank: 20,
      faceit_elo: 1500,
      faceit_level: 10,
      faceit_kd: 1.5
    }, // account_id 3 - Aabe (auth user)
    {
      steam_id: "76561197960275646",
      season_id: 16,
      cs_hours: 1900,
      cs2_rank: 17,
      faceit_elo: 1500,
      faceit_level: 10,
      faceit_kd: 1.5
    }, // account_id 5 - Quattra
    {
      steam_id: "76561197960283671",
      season_id: 16,
      cs_hours: 1400,
      cs2_rank: 11,
      faceit_elo: 1500,
      faceit_level: 10,
      faceit_kd: 1.5
    }, // account_id 6 - Trev
    // Add data for error testing Steam IDs
    {
      steam_id: "76561197967885016",
      season_id: 16,
      cs_hours: 1500,
      cs2_rank: 15,
      faceit_elo: 1500,
      faceit_level: 10,
      faceit_kd: 1.5
    } // account_id 1 - PrivateProfilePlayer (normal hours, but private profile)
    // NOTE: Intentionally NOT adding SeasonPlayerRanks for 76561197960269868 (InsufficientHoursPlayer)
    // so it falls back to Steam API mock which returns null for hours detection failure
  ] satisfies Partial<SeasonPlayerRank>[];

  // Insert SeasonPlayerRanks data
  for (const rankData of playerRanksData) {
    const now = new Date();
    await knex.raw(
      `
      INSERT INTO SeasonPlayerRanks 
        (steam_id, season_id, cs_hours, cs2_rank, hours_updated_at, rank_updated_at, faceit_elo, faceit_level, faceit_kd)
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        cs_hours = VALUES(cs_hours),
        cs2_rank = VALUES(cs2_rank),
        hours_updated_at = VALUES(hours_updated_at),
        rank_updated_at = VALUES(rank_updated_at),
        faceit_elo = VALUES(faceit_elo),
        faceit_level = VALUES(faceit_level),
        faceit_kd = VALUES(faceit_kd)
    `,
      [
        rankData.steam_id,
        rankData.season_id,
        rankData.cs_hours,
        rankData.cs2_rank,
        now,
        now,
        rankData.faceit_elo,
        rankData.faceit_level,
        rankData.faceit_kd
      ]
    );
  }
}
