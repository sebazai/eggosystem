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

  // Define NEW fake test Steam IDs that E2E tests will use (starting with 6)
  const testSteamIds = [
    "66561198999999901", // account_id 15003 - Aabe
    "66561198999999902", // account_id 15004 - heppajpg (JWT user)
    "66561198999999903", // account_id 15005 - Quattra
    "66561198999999904", // account_id 15006 - Trev
    "66561198999999905", // account_id 15008 - Hoolyz
    "66561198999999906", // account_id 15009 - RealPlayer1
    "66561198999999907", // account_id 15010 - RealPlayer2
    "66561198999999908", // account_id 15011 - RealPlayer3
    "66561198999999909", // account_id 15001 - PrivateProfilePlayer
    "66561198999999910", // account_id 15002 - InsufficientHoursPlayer
    "66561198999999911", // account_id 15012 - IncompleteDetailsPlayer
    "66561198999999912", // account_id 15013 - RaceConditionPlayer
    "66561198999999913" // account_id 15014 - NoFaceitRankPlayer (for testing external rank error)
  ];

  // Clean up team 2263 specifically - this team contains conflicting Steam IDs from regular seed
  await knex("SeasonTeamPlayers").where({ team_id: 2263 }).del();
  await knex("SeasonTeamRegistrations").where({ team_id: 2263 }).del();

  // Clean up ALL existing registrations for test Steam IDs (not just season 16)
  for (const steamId of testSteamIds) {
    // Delete from SeasonTeamPlayers for ALL seasons (not just season 16)
    await knex("SeasonTeamPlayers").where({ steam_id: steamId }).del();

    // Delete from SeasonTeamRegistrationPlayers for ALL seasons (not just season 16)
    await knex("SeasonTeamRegistrationPlayers")
      .where({ steam_id: steamId })
      .del();

    // remove all manual approvals
    await knex("SeasonPlayerApprovals").where({ steam_id: steamId }).del();
  }

  // Clean up existing E2E test data
  await knex("AccountPermissionScopes")
    .where({ season_id: 16, team_id: 999 })
    .del();
  await knex("AccountRoles").where({ account_id: 15003, game_id: 1 }).del();
  await knex("SeasonTeamPlayers").where({ season_id: 16 }).del();
  await knex("SeasonTeamRegistrationPlayers").where({ season_id: 16 }).del();
  await knex("SeasonTeamRegistrations").where({ season_id: 16 }).del();
  await knex("Teams").where({ id: 999 }).del();
  await knex("Organizations").where({ id: 999 }).del();
  await knex("Seasons").where({ id: 16 }).del();

  // Clean up NEW test accounts and related data if they exist
  const testAccountIds = [
    15001, 15002, 15003, 15004, 15005, 15006, 15008, 15009, 15010, 15011, 15012,
    15013, 15014
  ];
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

  // Update user emails in the Accounts table for NEW account IDs
  const users = [
    { id: 15001 },
    { id: 15002 },
    { id: 15003 },
    { id: 15004 },
    { id: 15005 },
    { id: 15006 },
    { id: 15008 },
    { id: 15009 },
    { id: 15010 },
    { id: 15011 },
    { id: 15012 },
    { id: 15013 },
    { id: 15014 }
  ];

  for (const user of users) {
    // First, ensure the account exists by inserting it
    await knex.raw(
      `
      INSERT INTO Accounts (id, full_name, work_email, work_email_verified, is_work_email_personal_email)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        full_name = VALUES(full_name),
        work_email = VALUES(work_email),
        work_email_verified = VALUES(work_email_verified),
        is_work_email_personal_email = VALUES(is_work_email_personal_email)
    `,
      [user.id, `Test User ${user.id}`, `test+${user.id}@kanaliiga.fi`, 1, 0]
    );

    // Special handling for IncompleteDetailsPlayer (account_id 15012)
    if (user.id === 15012) {
      // Set up incomplete/invalid data for testing
      await knex("Accounts").where({ id: user.id }).update({
        work_email: null, // Missing work email
        work_email_verified: 0, // Not verified
        full_name: "IncompletePlayer" // Missing space - invalid full name
      });
    }

    // Insert or update UserPolicyAcceptances using raw query with ON DUPLICATE KEY UPDATE
    // Use the same privacy policy version that the backend expects
    if (user.id === 15012) {
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
    { id: 105, token: "valid-token-def", email: "emailtest5@kanaliiga.fi" },
    { id: 106, token: "valid-token-mobile", email: "emailtest6@kanaliiga.fi" }
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

  // Ensure we have SteamPlayers for the NEW accounts we need
  // This creates the missing accounts and steam players with NEW fake Steam IDs
  const steamPlayerData = [
    {
      account_id: 15003,
      steam_id: "66561198999999901",
      nickname: "Aabe",
      discord: "aabe#1234"
    },
    {
      account_id: 15004,
      steam_id: "66561198999999902",
      nickname: "heppajpg",
      discord: "heppajpg#1234"
    },
    {
      account_id: 15005,
      steam_id: "66561198999999903",
      nickname: "Quattra",
      work_email: "test+15005@kanaliiga.fi",
      work_email_verified: 1,
      is_work_email_personal_email: true,
      discord: "quattra#1234"
    },
    {
      account_id: 15006,
      steam_id: "66561198999999904",
      nickname: "Trev",
      work_email_verified: 0,
      discord: "trev#1234"
    },
    {
      account_id: 15008,
      steam_id: "66561198999999905",
      nickname: "Hoolyz",
      discord: "hoolyz#1234"
    },
    {
      account_id: 15009,
      steam_id: "66561198999999906",
      nickname: "RealPlayer1",
      discord: "realplayer1#1234"
    },
    {
      account_id: 15010,
      steam_id: "66561198999999907",
      nickname: "RealPlayer2",
      discord: "realplayer2#1234"
    },
    {
      account_id: 15011,
      steam_id: "66561198999999908",
      nickname: "RealPlayer3",
      discord: "realplayer3#1234"
    },
    {
      account_id: 15001,
      steam_id: "66561198999999909",
      nickname: "PrivateProfilePlayer",
      discord: "privateprofileplayer#1234"
    },
    {
      account_id: 15002,
      steam_id: "66561198999999910",
      nickname: "InsufficientHoursPlayer"
    },
    {
      account_id: 15012,
      steam_id: "66561198999999911",
      nickname: "IncompleteDetailsPlayer"
    },
    {
      account_id: 15013,
      steam_id: "66561198999999912",
      nickname: "RaceConditionPlayer"
    },
    {
      account_id: 15014,
      steam_id: "66561198999999913",
      nickname: "NoFaceitRankPlayer"
    }
  ];

  for (const player of steamPlayerData) {
    // Insert account if it doesn't exist
    await knex.raw(
      `
      INSERT INTO Accounts (id, full_name, work_email, work_email_verified, is_work_email_personal_email, discord)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        work_email = VALUES(work_email),
        work_email_verified = VALUES(work_email_verified),
        is_work_email_personal_email = VALUES(is_work_email_personal_email),
        discord = VALUES(discord)
    `,
      [
        player.account_id,
        player.nickname,
        player.work_email ?? `test+${player.account_id}@kanaliiga.fi`,
        player.work_email_verified ?? 1,
        player.is_work_email_personal_email ?? 0,
        player.discord ?? `${player.nickname}#1234`
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

  // Set up SeasonTeamPlayers for employment approval testing
  const seasonTeamPlayers = [
    // account_id 15005 (66561198999999903) - approve manually for testing organizer approval
    {
      season_id: 16,
      team_id: 999,
      steam_id: "66561198999999903" // Updated to new Steam ID
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

  // Set account_id 15006 to have personal email to test organizer approval workflow
  await knex("Accounts").where({ id: 15006 }).update({
    work_email: "personal.email@gmail.com",
    work_email_verified: 1,
    is_work_email_personal_email: true
  });

  // Set up captain permissions for account_id 15003 (the auth user)
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

  // Add captain role to account_id 15003
  await knex.raw(
    `
    INSERT INTO AccountRoles (account_id, role_id, game_id)
    SELECT 15003, r.id, 1
    FROM Roles r
    WHERE r.role_name = 'captain'
    ON DUPLICATE KEY UPDATE account_id = VALUES(account_id)
  `
  );

  // Add edit-registration permission scope for season 16, team 999 to account_id 15003
  await knex.raw(
    `
    INSERT INTO AccountPermissionScopes (account_id, permission_id, season_id, team_id)
    SELECT 15003, p.id, 16, 999
    FROM Permissions p
    WHERE p.permission_name = 'edit-registration'
    ON DUPLICATE KEY UPDATE account_id = VALUES(account_id)
  `
  );

  // Add SeasonPlayerRanks data for our NEW test players
  // This ensures backend validation passes during submission
  const playerRanksData = [
    {
      steam_id: "66561198999999902", // heppajpg
      season_id: 16,
      cs_hours: 1500,
      cs2_rank: 15,
      faceit_elo: 1500,
      faceit_level: 10,
      faceit_kd: 1.5
    },
    {
      steam_id: "66561198999999905", // Hoolyz
      season_id: 16,
      cs_hours: 2000,
      cs2_rank: 18,
      faceit_elo: 1500,
      faceit_level: 10,
      faceit_kd: 1.5
    },
    {
      steam_id: "66561198999999906", // RealPlayer1
      season_id: 16,
      cs_hours: 1800,
      cs2_rank: 12,
      faceit_elo: 1500,
      faceit_level: 10,
      faceit_kd: 1.5
    },
    {
      steam_id: "66561198999999907", // RealPlayer2
      season_id: 16,
      cs_hours: 1600,
      cs2_rank: 14,
      faceit_elo: 1500,
      faceit_level: 10,
      faceit_kd: 1.5
    },
    {
      steam_id: "66561198999999908", // RealPlayer3
      season_id: 16,
      cs_hours: 1700,
      cs2_rank: 16,
      faceit_elo: 1500,
      faceit_level: 10,
      faceit_kd: 1.5
    },
    {
      steam_id: "66561198999999901", // Aabe (auth user)
      season_id: 16,
      cs_hours: 2200,
      cs2_rank: 20,
      faceit_elo: 1500,
      faceit_level: 10,
      faceit_kd: 1.5
    },
    {
      steam_id: "66561198999999903", // Quattra
      season_id: 16,
      cs_hours: 1900,
      cs2_rank: 17,
      faceit_elo: 1500,
      faceit_level: 10,
      faceit_kd: 1.5
    },
    {
      steam_id: "66561198999999904", // Trev
      season_id: 16,
      cs_hours: 1400,
      cs2_rank: 11,
      faceit_elo: 1500,
      faceit_level: 10,
      faceit_kd: 1.5
    },
    {
      steam_id: "66561198999999909", // PrivateProfilePlayer
      season_id: 16,
      cs_hours: 1500,
      cs2_rank: 15,
      faceit_elo: 1500,
      faceit_level: 10,
      faceit_kd: 1.5
    },
    {
      steam_id: "66561198999999913", // NoFaceitRankPlayer - has CS2 rank but no FaceIT rank
      season_id: 16,
      cs_hours: 1200,
      cs2_rank: 13,
      faceit_elo: undefined, // No FaceIT ELO
      faceit_level: undefined, // No FaceIT level - this will trigger external rank error
      faceit_kd: undefined // No FaceIT KD
    }
    // NOTE: Intentionally NOT adding SeasonPlayerRanks for 66561198999999910 (InsufficientHoursPlayer)
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
        rankData.faceit_elo ?? null,
        rankData.faceit_level ?? null,
        rankData.faceit_kd ?? null
      ]
    );
  }
}
