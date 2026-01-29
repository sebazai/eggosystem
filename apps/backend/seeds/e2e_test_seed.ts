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
  EligiblePlayerForValidationSteamId,
  e2eSteamPlayerData,
  getE2ESteamPlayerBySteamId,
  ValidWorkEmail2SteamId,
  ValidWorkEmail3SteamId,
  ValidWorkEmail4SteamId,
  ValidWorkEmail5SteamId,
  ValidWorkEmail1SteamId,
  ApprovalOnlySubmitSteamId,
  ManualApprovalTargetSteamId,
  ManualRankTargetSteamId
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

  const testSteamIds = e2eSteamPlayerData.map((player) => player.steam_id);
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
    .where({ season_id: 16 })
    .whereIn("team_id", [999, 998, 997])
    .del();
  await knex("AccountRoles").where({ account_id: 15003, game_id: 1 }).del();
  await knex("SeasonTeamPlayers").where({ season_id: 16 }).del();
  await knex("SeasonTeamRegistrationPlayers").where({ season_id: 16 }).del();
  await knex("SeasonTeamRegistrations").where({ season_id: 16 }).del();
  await knex("Teams").whereIn("id", [999, 998, 997]).del();
  await knex("Organizations").whereIn("id", [999, 998, 997]).del();
  await knex("Seasons").where({ id: 16 }).del();

  // Clean up NEW test accounts and related data if they exist
  const testAccountIds = e2eSteamPlayerData.map((player) => player.account_id);
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
    "E2E Test Org 998",
    "E2E Test Org 997",
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
    { id: getE2ESteamPlayerBySteamId(PrivateProfilePlayerSteamId)?.account_id },
    {
      id: getE2ESteamPlayerBySteamId(InsufficientHoursPlayerSteamId)?.account_id
    },
    { id: getE2ESteamPlayerBySteamId(AabeSteamId)?.account_id },
    { id: getE2ESteamPlayerBySteamId(heppajpgSteamId)?.account_id },
    { id: getE2ESteamPlayerBySteamId(QuattraSteamId)?.account_id },
    { id: getE2ESteamPlayerBySteamId(TrevSteamId)?.account_id },
    { id: getE2ESteamPlayerBySteamId(ValidWorkEmail1SteamId)?.account_id }, // New player with valid work email
    { id: getE2ESteamPlayerBySteamId(HoolyzSteamId)?.account_id },
    { id: getE2ESteamPlayerBySteamId(RealPlayer1SteamId)?.account_id },
    { id: getE2ESteamPlayerBySteamId(RealPlayer2SteamId)?.account_id },
    { id: getE2ESteamPlayerBySteamId(RealPlayer3SteamId)?.account_id },
    {
      id: getE2ESteamPlayerBySteamId(IncompleteDetailsPlayerSteamId)?.account_id
    },
    { id: getE2ESteamPlayerBySteamId(RaceConditionPlayerSteamId)?.account_id },
    { id: getE2ESteamPlayerBySteamId(NoFaceitRankPlayerSteamId)?.account_id },
    { id: getE2ESteamPlayerBySteamId(ValidWorkEmail2SteamId)?.account_id }, // New player with valid work email
    { id: getE2ESteamPlayerBySteamId(ValidWorkEmail3SteamId)?.account_id }, // New player with valid work email
    { id: getE2ESteamPlayerBySteamId(ValidWorkEmail4SteamId)?.account_id }, // New player with valid work email
    { id: getE2ESteamPlayerBySteamId(ValidWorkEmail5SteamId)?.account_id }, // New player with valid work email
    {
      id: getE2ESteamPlayerBySteamId(EligiblePlayerForValidationSteamId)
        ?.account_id
    }, // EligiblePlayerForValidation
    {
      id: getE2ESteamPlayerBySteamId(ValidationFailurePlayerSteamId)?.account_id
    } // ValidationFailurePlayer
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
    if (
      user.id ===
      getE2ESteamPlayerBySteamId(IncompleteDetailsPlayerSteamId)?.account_id
    ) {
      // Set up incomplete/invalid data for testing
      await knex("Accounts").where({ id: user.id }).update({
        work_email: null, // Missing work email
        work_email_verified: 0, // Not verified
        full_name: "IncompletePlayer" // Missing space - invalid full name
      });
    }

    // Special handling for ValidationFailurePlayer (account_id 15021)
    if (
      user.id ===
      getE2ESteamPlayerBySteamId(ValidationFailurePlayerSteamId)?.account_id
    ) {
      // Set up incomplete/invalid data for testing multiple validation failures
      await knex("Accounts").where({ id: user.id }).update({
        work_email: null, // Missing work email
        work_email_verified: 0, // Not verified
        full_name: "Invalid" // Invalid full name (no space)
      });
    }

    // Insert or update UserPolicyAcceptances using raw query with ON DUPLICATE KEY UPDATE
    // Use the same privacy policy version that the backend expects
    if (
      user.id ===
      getE2ESteamPlayerBySteamId(IncompleteDetailsPlayerSteamId)?.account_id
    ) {
      // IncompleteDetailsPlayer - set up incomplete privacy policy acceptance
      await knex.raw(
        `
        INSERT INTO UserPolicyAcceptances 
          (account_id, accepted_privacy_policy, accepted_marketing, accepted_tournament_newsletter, privacy_policy_version)
        VALUES 
          (?, 0, 0, 1, 'old_version')
        ON DUPLICATE KEY UPDATE 
          accepted_privacy_policy = 0,
          privacy_policy_version = 'old_version'
      `,
        [user.id]
      );
    } else if (
      user.id ===
      getE2ESteamPlayerBySteamId(ValidationFailurePlayerSteamId)?.account_id
    ) {
      // ValidationFailurePlayer - set up incomplete privacy policy acceptance
      await knex.raw(
        `
        INSERT INTO UserPolicyAcceptances 
          (account_id, accepted_privacy_policy, accepted_marketing, accepted_tournament_newsletter, privacy_policy_version)
        VALUES 
          (?, 0, 0, 1, 'old_version')
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
          (account_id, accepted_privacy_policy, accepted_marketing, accepted_tournament_newsletter, privacy_policy_version)
        VALUES 
          (?, 1, 0, 1, ?)
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
        (account_id, accepted_privacy_policy, accepted_marketing, accepted_tournament_newsletter, privacy_policy_version)
      VALUES 
        (?, 1, 0, 1, ?)
      ON DUPLICATE KEY UPDATE 
        accepted_privacy_policy = 1,
        privacy_policy_version = VALUES(privacy_policy_version)
    `,
      [accountId, privacyPolicyVersion]
    );
  }

  // Import Steam player data from types package
  const steamPlayerData = e2eSteamPlayerData;

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

  // Wrongful-data-for-test: we inject initial state so E2E can assert "see error → fix (admin or DB) → see green".
  // We set work_email, work_email_verified, full_name, etc. here; we do not simulate full profile flows.
  // The fix step is done in the test: A1/A2 use the admin panel (manual approval, manual rank), which writes
  // SeasonPlayerApprovals / SeasonPlayerRanks – that is enough for backend validation, so no mid-test DB injection.
  const manualApprovalAccountId = getE2ESteamPlayerBySteamId(
    ManualApprovalTargetSteamId
  )?.account_id;
  const manualRankAccountId = getE2ESteamPlayerBySteamId(
    ManualRankTargetSteamId
  )?.account_id;
  if (manualApprovalAccountId) {
    await knex("Accounts").where({ id: manualApprovalAccountId }).update({
      full_name: "Manual Approval Target",
      work_email: null,
      work_email_verified: 0
    });
  }
  if (manualRankAccountId) {
    await knex("Accounts")
      .where({ id: manualRankAccountId })
      .update({ full_name: "Manual Rank Target" });
  }
  // ManualRankTarget has no SeasonPlayerRanks for season 16 here; internal rank is -1 until admin adds manual rank in A2

  // Ensure all E2E steam player accounts have UserPolicyAcceptances so signup/registration
  // tests are not redirected to profile for missing policy. Skip accounts used for incomplete-policy tests.
  const incompletePolicyAccountIds = [
    getE2ESteamPlayerBySteamId(IncompleteDetailsPlayerSteamId)?.account_id,
    getE2ESteamPlayerBySteamId(ValidationFailurePlayerSteamId)?.account_id
  ].filter((id): id is number => id != null);
  for (const player of e2eSteamPlayerData) {
    if (incompletePolicyAccountIds.includes(player.account_id)) continue;
    await knex.raw(
      `
      INSERT INTO UserPolicyAcceptances 
        (account_id, accepted_privacy_policy, accepted_marketing, accepted_tournament_newsletter, privacy_policy_version)
      VALUES 
        (?, 1, 0, 1, ?)
      ON DUPLICATE KEY UPDATE 
        accepted_privacy_policy = 1,
        privacy_policy_version = VALUES(privacy_policy_version)
    `,
      [player.account_id, privacyPolicyVersion]
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

  // A1/A2: org+team with no registration so admin tests can submit without 409
  await knex("Organizations").insert([
    {
      id: 998,
      name: "E2E Test Org 998",
      organization_code: "2992559-3",
      website: "https://kanaliiga.fi"
    },
    {
      id: 997,
      name: "E2E Test Org 997",
      organization_code: "2992559-4",
      website: "https://kanaliiga.fi"
    }
  ]);
  await knex("Teams").insert([
    {
      id: 998,
      name: "E2E Test Team 998",
      organization_id: 998,
      org_approved: true
    },
    {
      id: 997,
      name: "E2E Test Team 997",
      organization_id: 997,
      org_approved: true
    }
  ]);

  // Set up SeasonPlayerApprovals for employment/organizer approval testing
  const seasonTeamPlayers = [
    // account_id 15005 (QuattraSteamId) - approve manually for testing organizer approval
    {
      season_id: 16,
      team_id: 999,
      steam_id: QuattraSteamId
    },
    // account_id 15023 (ApprovalOnlySubmitSteamId) - S3: no work email but in SeasonPlayerApprovals so submit succeeds
    {
      season_id: 16,
      team_id: 999,
      steam_id: ApprovalOnlySubmitSteamId
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

  // S3: ApprovalOnlySubmit (15023) needs is_valid_full_name true — seed uses nickname as full_name; "ApprovalOnlySubmit" has no space
  await knex("Accounts").where({ id: 15023 }).update({
    full_name: "Approval OnlySubmit"
  });

  // S2: DraftReturnUser (15022) needs is_valid_full_name true for draft-return test (form prefilled from draft)
  await knex("Accounts").where({ id: 15022 }).update({
    full_name: "Draft Return User"
  });

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
      steam_id: AabeSteamId, // account_id 15003 - Aabe (captain)
      is_captain: true,
      is_co_captain: false
    },
    {
      season_id: 16,
      team_id: 999,
      steam_id: TrevSteamId, // account_id 15006 - Trev (co-captain)
      is_captain: false,
      is_co_captain: true
    },
    {
      season_id: 16,
      team_id: 999,
      steam_id: QuattraSteamId, // account_id 15005 - Quattra (co-captain)
      is_captain: false,
      is_co_captain: false
    }
  ];

  for (const player of teamPlayers) {
    await knex("SeasonTeamRegistrationPlayers").insert(player);
  }

  // Add Discord LinkedAccounts for captains and co-captains
  // Aabe (account_id 15003) - captain
  await knex.raw(`
    INSERT INTO LinkedAccounts (account_id, provider, provider_id, provider_username)
    VALUES (15003, 'discord', '15003-discord-id', 'aabe')
    ON DUPLICATE KEY UPDATE 
      provider_id = VALUES(provider_id),
      provider_username = VALUES(provider_username)
  `);

  // Trev (account_id 15006) - co-captain
  await knex.raw(`
    INSERT INTO LinkedAccounts (account_id, provider, provider_id, provider_username)
    VALUES (15006, 'discord', '15006-discord-id', 'trev')
    ON DUPLICATE KEY UPDATE 
      provider_id = VALUES(provider_id),
      provider_username = VALUES(provider_username)
  `);

  // Add Discord LinkedAccounts for other test players that have discord in e2e-test-data.ts
  // This ensures tests that check for Discord linked status work correctly
  const playersWithDiscord = [
    { account_id: 15003, username: "aabe" }, // Aabe - captain
    { account_id: 15004, username: "heppajpg" }, // heppajpg
    { account_id: 15005, username: "quattra" }, // Quattra
    { account_id: 15006, username: "trev" }, // Trev - co-captain
    { account_id: 15008, username: "hoolyz" }, // Hoolyz
    { account_id: 15009, username: "realplayer1" }, // RealPlayer1
    { account_id: 15010, username: "realplayer2" }, // RealPlayer2
    { account_id: 15011, username: "realplayer3" }, // RealPlayer3
    { account_id: 15001, username: "privateprofileplayer" }, // PrivateProfilePlayer
    { account_id: 15007, username: "validworkemail1" }, // ValidWorkEmail1
    { account_id: 15015, username: "validworkemail2" }, // ValidWorkEmail2
    { account_id: 15016, username: "validworkemail3" }, // ValidWorkEmail3
    { account_id: 15017, username: "validworkemail4" }, // ValidWorkEmail4
    { account_id: 15018, username: "validworkemail5" }, // ValidWorkEmail5
    { account_id: 15020, username: "eligibleplayer" }, // EligiblePlayerForValidation
    { account_id: 15023, username: "approvalonlysubmit" }, // ApprovalOnlySubmit - captain in approval-only test
    { account_id: 15024, username: "manualapprovaltarget" }, // ManualApprovalTarget - captain in A1 test
    { account_id: 15025, username: "manualranktarget" }, // ManualRankTarget - captain in A2 test
    { account_id: 15026, username: "a5signup1" }, // A5 add-team signup only
    { account_id: 15027, username: "a5signup2" },
    { account_id: 15028, username: "a5signup3" },
    { account_id: 15029, username: "a5signup4" },
    { account_id: 15030, username: "a5signup5" }
  ];

  for (const player of playersWithDiscord) {
    await knex.raw(
      `
      INSERT INTO LinkedAccounts (account_id, provider, provider_id, provider_username)
      VALUES (?, 'discord', ?, ?)
      ON DUPLICATE KEY UPDATE 
        provider_id = VALUES(provider_id),
        provider_username = VALUES(provider_username)
    `,
      [player.account_id, `${player.account_id}-discord-id`, player.username]
    );
  }

  // Add admin role for heppajpg (account_id 15004) for e2e tests
  // This is needed because the sortter page requires admin role
  await knex.raw(`
    INSERT INTO AccountRoles (account_id, role_id, game_id) 
    SELECT 15004, id, 1 FROM Roles WHERE role_name = 'admin'
    ON DUPLICATE KEY UPDATE account_id = account_id
  `);
}
