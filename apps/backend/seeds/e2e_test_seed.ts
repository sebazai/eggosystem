import {
  heppajpgSteamId,
  HoolyzSteamId,
  AabeSteamId,
  QuattraSteamId,
  TrevSteamId,
  RealPlayer1SteamId,
  RealPlayer2SteamId,
  RealPlayer3SteamId,
  PrivateProfilePlayerSteamId,
  InsufficientHoursPlayerSteamId,
  IncompleteDetailsPlayerSteamId,
  RaceConditionPlayerSteamId,
  NoFaceitRankPlayerSteamId,
  ValidationFailurePlayerSteamId,
  EligiblePlayerForValidationSteamId
} from "@eggosystem/types";
import { type Knex } from "knex";

/**
 * E2E Test Seed
 *
 * This seed file is specifically for E2E testing. It creates a new season
 * with the specified parameters.
 */
export async function seed(knex: Knex): Promise<void> {
  // Get privacy policy version from environment variable (same as backend uses)
  const privacyPolicyVersion = process.env.PRIVACY_POLICY_VERSION || "1";

  const testSteamIds = [
    AabeSteamId, // account_id 15003 - Aabe
    heppajpgSteamId, // account_id 15004 - heppajpg (JWT user)
    QuattraSteamId, // account_id 15005 - Quattra
    TrevSteamId, // account_id 15006 - Trev
    HoolyzSteamId, // account_id 15008 - Hoolyz
    RealPlayer1SteamId, // account_id 15009 - RealPlayer1
    RealPlayer2SteamId, // account_id 15010 - RealPlayer2
    RealPlayer3SteamId, // account_id 15011 - RealPlayer3
    PrivateProfilePlayerSteamId, // account_id 15001 - PrivateProfilePlayer
    InsufficientHoursPlayerSteamId, // account_id 15002 - InsufficientHoursPlayer
    IncompleteDetailsPlayerSteamId, // account_id 15012 - IncompleteDetailsPlayer
    RaceConditionPlayerSteamId, // account_id 15013 - RaceConditionPlayer
    NoFaceitRankPlayerSteamId, // account_id 15014 - NoFaceitRankPlayer (for testing external rank error)
    EligiblePlayerForValidationSteamId, // account_id 15020 - EligiblePlayerForValidation
    ValidationFailurePlayerSteamId // account_id 15021 - ValidationFailurePlayer (multiple validation failures)
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
    15013, 15014, 15020, 15021
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
    { id: 15007 }, // New player with valid work email
    { id: 15008 },
    { id: 15009 },
    { id: 15010 },
    { id: 15011 },
    { id: 15012 },
    { id: 15013 },
    { id: 15014 },
    { id: 15015 }, // New player with valid work email
    { id: 15016 }, // New player with valid work email
    { id: 15017 }, // New player with valid work email
    { id: 15018 }, // New player with valid work email
    { id: 15020 }, // EligiblePlayerForValidation
    { id: 15021 } // ValidationFailurePlayer
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

    // Special handling for ValidationFailurePlayer (account_id 15021)
    if (user.id === 15021) {
      // Set up incomplete/invalid data for testing multiple validation failures
      await knex("Accounts").where({ id: user.id }).update({
        work_email: null, // Missing work email
        work_email_verified: 0, // Not verified
        full_name: "Invalid", // Invalid full name (no space)
        discord: null // Missing discord
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
    } else if (user.id === 15021) {
      // ValidationFailurePlayer - set up incomplete privacy policy acceptance
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
    { id: 106, token: "valid-token-mobile", email: "emailtest6@kanaliiga.fi" },
    // Additional tokens for bug verification tests to prevent conflicts
    { id: 107, token: "bug-test-redis-token", email: "bugtest1@kanaliiga.fi" },
    { id: 108, token: "bug-test-db-token", email: "bugtest2@kanaliiga.fi" },
    { id: 109, token: "bug-test-multiple-1", email: "bugtest3@kanaliiga.fi" },
    { id: 110, token: "bug-test-multiple-2", email: "bugtest4@kanaliiga.fi" },
    { id: 111, token: "bug-test-multiple-3", email: "bugtest5@kanaliiga.fi" },
    { id: 112, token: "bug-test-navigation", email: "bugtest6@kanaliiga.fi" },
    { id: 113, token: "bug-test-loading", email: "bugtest7@kanaliiga.fi" }
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
    },
    // New players with valid work emails for signup form tests
    {
      account_id: 15007,
      steam_id: "66561198999999920",
      nickname: "ValidWorkEmail1",
      work_email: "test+15007@kanaliiga.fi",
      work_email_verified: 1,
      is_work_email_personal_email: false,
      discord: "validworkemail1#1234"
    },
    {
      account_id: 15015,
      steam_id: "66561198999999921",
      nickname: "ValidWorkEmail2",
      work_email: "test+15015@kanaliiga.fi",
      work_email_verified: 1,
      is_work_email_personal_email: false,
      discord: "validworkemail2#1234"
    },
    {
      account_id: 15016,
      steam_id: "66561198999999922",
      nickname: "ValidWorkEmail3",
      work_email: "test+15016@kanaliiga.fi",
      work_email_verified: 1,
      is_work_email_personal_email: false,
      discord: "validworkemail3#1234"
    },
    {
      account_id: 15017,
      steam_id: "66561198999999923",
      nickname: "ValidWorkEmail4",
      work_email: "test+15017@kanaliiga.fi",
      work_email_verified: 1,
      is_work_email_personal_email: false,
      discord: "validworkemail4#1234"
    },
    {
      account_id: 15018,
      steam_id: "66561198999999924",
      nickname: "ValidWorkEmail5",
      work_email: "test+15018@kanaliiga.fi",
      work_email_verified: 1,
      is_work_email_personal_email: false,
      discord: "validworkemail5#1234"
    },
    // New players for add player validation tests
    {
      account_id: 15020,
      steam_id: "76561198054765387",
      nickname: "EligiblePlayerForValidation",
      discord: "eligibleplayer#1234"
    },
    {
      account_id: 15021,
      steam_id: "66561198999999914",
      nickname: "ValidationFailurePlayer",
      // NOTE: This player will have intentionally incomplete/invalid data for testing multiple validation failures
      work_email: null, // Missing work email
      work_email_verified: 0, // Not verified
      discord: null // Missing discord
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

  // Create team registration and player records for season 16, team 999
  // This will automatically create captain permissions via database triggers
  await knex("SeasonTeamRegistrations").insert({
    season_id: 16,
    team_id: 999,
    approved: true,
    terms_and_conditions_approved: true
  });

  // Add players to the team registration with captain status
  // This will automatically create captain permissions via database triggers
  const teamPlayers = [
    {
      season_id: 16,
      team_id: 999,
      steam_id: "66561198999999901", // account_id 15003 - Aabe (captain)
      is_captain: true,
      is_co_captain: false
    },
    {
      season_id: 16,
      team_id: 999,
      steam_id: "66561198999999904", // account_id 15006 - Trev (co-captain)
      is_captain: false,
      is_co_captain: true
    },
    {
      season_id: 16,
      team_id: 999,
      steam_id: "66561198999999903", // account_id 15005 - Quattra (co-captain)
      is_captain: false,
      is_co_captain: false
    }
  ];

  for (const player of teamPlayers) {
    await knex("SeasonTeamRegistrationPlayers").insert(player);
  }

  // Add SeasonTeamPlayers records for the sortter API
  // This is needed because the sortter API queries SeasonTeamPlayers table
  const seasonTeamPlayersForSortter = [
    {
      season_id: 16,
      team_id: 999,
      steam_id: "66561198999999901", // Aabe
      role: "primary",
      is_captain: true,
      is_co_captain: false
    },
    {
      season_id: 16,
      team_id: 999,
      steam_id: "66561198999999902", // heppajpg
      role: "primary",
      is_captain: false,
      is_co_captain: true
    },
    {
      season_id: 16,
      team_id: 999,
      steam_id: "66561198999999903", // Quattra
      role: "primary",
      is_captain: false,
      is_co_captain: false
    },
    {
      season_id: 16,
      team_id: 999,
      steam_id: "66561198999999905", // Hoolyz
      role: "primary",
      is_captain: false,
      is_co_captain: false
    },
    {
      season_id: 16,
      team_id: 999,
      steam_id: "66561198999999906", // RealPlayer1
      role: "primary",
      is_captain: false,
      is_co_captain: false
    },
    {
      season_id: 16,
      team_id: 999,
      steam_id: "66561198999999907", // RealPlayer2
      role: "primary",
      is_captain: false,
      is_co_captain: false
    },
    {
      season_id: 16,
      team_id: 999,
      steam_id: "66561198999999908", // RealPlayer3
      role: "primary",
      is_captain: false,
      is_co_captain: false
    }
  ];

  for (const player of seasonTeamPlayersForSortter) {
    await knex("SeasonTeamPlayers").insert(player);
  }

  // Add admin role for heppajpg (account_id 15004) for e2e tests
  // This is needed because the sortter page requires admin role
  await knex.raw(`
    INSERT INTO AccountRoles (account_id, role_id, game_id) 
    SELECT 15004, id, 1 FROM Roles WHERE role_name = 'admin'
    ON DUPLICATE KEY UPDATE account_id = account_id
  `);

  // Add kana_elo values to SeasonPlayerRanks for the sortter API
  // The sortter API needs kana_elo values to calculate team rankings
  const kanaEloUpdates = [
    { steam_id: "66561198999999901", kana_elo: 180 }, // Aabe
    { steam_id: "66561198999999902", kana_elo: 175 }, // heppajpg
    { steam_id: "66561198999999903", kana_elo: 170 }, // Quattra
    { steam_id: "66561198999999905", kana_elo: 160 }, // Hoolyz
    { steam_id: "66561198999999906", kana_elo: 160 }, // RealPlayer1
    { steam_id: "66561198999999907", kana_elo: 150 }, // RealPlayer2
    { steam_id: "66561198999999908", kana_elo: 150 } // RealPlayer3
  ];

  for (const update of kanaEloUpdates) {
    await knex("SeasonPlayerRanks")
      .where({ steam_id: update.steam_id, season_id: 16 })
      .update({ kana_elo: update.kana_elo });
  }
}
