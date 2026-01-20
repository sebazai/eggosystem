import { runQuery } from "../db/mysqlRunQuery";
import { getMatchesByExternalId } from "../models/match.models";
import { mswServer } from "@eggosystem/shared-msw";
import { validateAndUpdateScheduledMatchTeams } from "./cron-scheduler.services";

// Test constants
const TEST_SEASON_ID = 99999;
const TEST_LEAGUE_ID = 99999;
const TEST_STAGE_ID = 1;
const TEST_CHAMPIONSHIP_ID = "test-championship-id";
const TEST_TEAM_A_ID = 99991;
const TEST_TEAM_B_ID = 99992;
const TEST_TEAM_C_ID = 99993;
const TEST_TEAM_A_EXTERNAL_ID = "team-a-external-id";
const TEST_TEAM_B_EXTERNAL_ID = "team-b-external-id";
const TEST_TEAM_C_EXTERNAL_ID = "team-c-external-id";
const MATCH_1_EXTERNAL_ID = "match-1-external-id";
const MATCH_2_EXTERNAL_ID = "match-2-external-id";

describe("Match Team Validation Integration Test", () => {
  beforeAll(() => {
    mswServer.listen({ onUnhandledRequest: "bypass" });
  });

  afterAll(() => {
    mswServer.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await cleanupTestData();
    // Seed test data
    await seedTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  const cleanupTestData = async () => {
    await runQuery("DELETE FROM MatchTeams WHERE match_id IN (?, ?)", [
      TEST_TEAM_A_ID,
      TEST_TEAM_B_ID
    ]);
    await runQuery("DELETE FROM Matches WHERE season_id = ?", [TEST_SEASON_ID]);
    await runQuery("DELETE FROM SeasonLeagueExternalIds WHERE season_id = ?", [
      TEST_SEASON_ID
    ]);
    await runQuery("DELETE FROM SeasonLeagueTeams WHERE season_id = ?", [
      TEST_SEASON_ID
    ]);
    await runQuery("DELETE FROM SeasonLeagues WHERE season_id = ?", [
      TEST_SEASON_ID
    ]);
    await runQuery("DELETE FROM Teams WHERE id IN (?, ?, ?)", [
      TEST_TEAM_A_ID,
      TEST_TEAM_B_ID,
      TEST_TEAM_C_ID
    ]);
    await runQuery("DELETE FROM Leagues WHERE id = ?", [TEST_LEAGUE_ID]);
    await runQuery("DELETE FROM Seasons WHERE id = ?", [TEST_SEASON_ID]);
  };

  const seedTestData = async () => {
    // Insert test season
    await runQuery(
      `INSERT INTO Seasons (id, game_id, name, full_name, start_date, end_date, platform)
       VALUES (?, 1, 'Test Season', 'Test Season Full Name', '2024-01-01', '2025-12-31', 'faceit')`,
      [TEST_SEASON_ID]
    );

    // Insert test league
    await runQuery(
      `INSERT INTO Leagues (id, name, sort_priority)
       VALUES (?, 'Test League', 1)`,
      [TEST_LEAGUE_ID]
    );

    // Insert SeasonLeagues record
    await runQuery(
      `INSERT INTO SeasonLeagues (season_id, league_id, tier)
       VALUES (?, ?, 1)`,
      [TEST_SEASON_ID, TEST_LEAGUE_ID]
    );

    // Insert SeasonLeagueExternalIds (required for cron job)
    await runQuery(
      `INSERT INTO SeasonLeagueExternalIds (external_id, external_league_name, season_id, league_id, stage_id, type, manual_group)
       VALUES (?, 'Test Championship', ?, ?, ?, 'playoff', NULL)`,
      [TEST_CHAMPIONSHIP_ID, TEST_SEASON_ID, TEST_LEAGUE_ID, TEST_STAGE_ID]
    );

    // Insert test teams (using unique names to avoid conflicts)
    await runQuery(
      `INSERT INTO Teams (id, organization_id, name, team_logo)
       VALUES 
         (?, NULL, ?, 'team_a.png'),
         (?, NULL, ?, 'team_b.png'),
         (?, NULL, ?, 'team_c.png')`,
      [
        TEST_TEAM_A_ID,
        `Team A ${TEST_SEASON_ID}`,
        TEST_TEAM_B_ID,
        `Team B ${TEST_SEASON_ID}`,
        TEST_TEAM_C_ID,
        `Team C ${TEST_SEASON_ID}`
      ]
    );

    // Insert SeasonLeagueTeams with external_team_id
    await runQuery(
      `INSERT INTO SeasonLeagueTeams (season_id, team_id, league_id, external_team_id)
       VALUES 
         (?, ?, ?, ?),
         (?, ?, ?, ?),
         (?, ?, ?, ?)`,
      [
        TEST_SEASON_ID,
        TEST_TEAM_A_ID,
        TEST_LEAGUE_ID,
        TEST_TEAM_A_EXTERNAL_ID,
        TEST_SEASON_ID,
        TEST_TEAM_B_ID,
        TEST_LEAGUE_ID,
        TEST_TEAM_B_EXTERNAL_ID,
        TEST_SEASON_ID,
        TEST_TEAM_C_ID,
        TEST_LEAGUE_ID,
        TEST_TEAM_C_EXTERNAL_ID
      ]
    );

    // Insert Match 1: Team A vs Team B (ABORTED - Team A abandoned)
    await runQuery(
      `INSERT INTO Matches (id, league_id, season_id, stage, best_of, start_timestamp, end_timestamp, external_match_room_id, status, round, \`group\`)
       VALUES (?, ?, ?, ?, 1, '2024-01-15 18:00:00', NULL, ?, 'ABORTED', 1, 1)`,
      [
        TEST_TEAM_A_ID,
        TEST_LEAGUE_ID,
        TEST_SEASON_ID,
        TEST_STAGE_ID,
        MATCH_1_EXTERNAL_ID
      ]
    );

    // Insert MatchTeams for Match 1
    await runQuery(
      `INSERT INTO MatchTeams (match_id, team_id, season_id, league_id)
       VALUES 
         (?, ?, ?, ?),
         (?, ?, ?, ?)`,
      [
        TEST_TEAM_A_ID,
        TEST_TEAM_A_ID,
        TEST_SEASON_ID,
        TEST_LEAGUE_ID,
        TEST_TEAM_A_ID,
        TEST_TEAM_B_ID,
        TEST_SEASON_ID,
        TEST_LEAGUE_ID
      ]
    );

    // Insert Match 2: Team B vs Team C (SCHEDULED - created because Match 1 was abandoned)
    // This match has wrong teams because Match 1 was restarted and Team A won
    await runQuery(
      `INSERT INTO Matches (id, league_id, season_id, stage, best_of, start_timestamp, end_timestamp, external_match_room_id, status, round, \`group\`)
       VALUES (?, ?, ?, ?, 1, '2024-01-20 18:00:00', NULL, ?, 'SCHEDULED', 2, 1)`,
      [
        TEST_TEAM_B_ID,
        TEST_LEAGUE_ID,
        TEST_SEASON_ID,
        TEST_STAGE_ID,
        MATCH_2_EXTERNAL_ID
      ]
    );

    // Insert MatchTeams for Match 2 (WRONG - should be Team A vs Team C, but has Team B vs Team C)
    await runQuery(
      `INSERT INTO MatchTeams (match_id, team_id, season_id, league_id)
       VALUES 
         (?, ?, ?, ?),
         (?, ?, ?, ?)`,
      [
        TEST_TEAM_B_ID,
        TEST_TEAM_B_ID,
        TEST_SEASON_ID,
        TEST_LEAGUE_ID,
        TEST_TEAM_B_ID,
        TEST_TEAM_C_ID,
        TEST_SEASON_ID,
        TEST_LEAGUE_ID
      ]
    );
  };

  it("should validate and update teams for SCHEDULED matches when teams mismatch", async () => {
    // Verify initial state: Match 2 has wrong teams (Team B vs Team C)
    const matchesBefore = await getMatchesByExternalId(MATCH_2_EXTERNAL_ID);
    expect(matchesBefore).toHaveLength(1);
    const matchBefore = matchesBefore[0];

    const matchTeamsBefore = await runQuery<Array<{ team_id: number }>>(
      `SELECT team_id FROM MatchTeams WHERE match_id = ? ORDER BY team_id`,
      [matchBefore.id]
    );
    const teamIdsBefore = matchTeamsBefore.map((mt) => mt.team_id);
    expect(teamIdsBefore).toContain(TEST_TEAM_B_ID); // Wrong team
    expect(teamIdsBefore).toContain(TEST_TEAM_C_ID);
    expect(teamIdsBefore).not.toContain(TEST_TEAM_A_ID); // Should have Team A

    // Run the validation function
    await validateAndUpdateScheduledMatchTeams();

    // Verify updated state: Match 2 should now have correct teams (Team A vs Team C)
    const matchesAfter = await getMatchesByExternalId(MATCH_2_EXTERNAL_ID);
    expect(matchesAfter).toHaveLength(1);
    const matchAfter = matchesAfter[0];

    const matchTeamsAfter = await runQuery<Array<{ team_id: number }>>(
      `SELECT team_id FROM MatchTeams WHERE match_id = ? ORDER BY team_id`,
      [matchAfter.id]
    );
    const teamIdsAfter = matchTeamsAfter.map((mt) => mt.team_id);
    expect(teamIdsAfter).toContain(TEST_TEAM_A_ID); // Correct team
    expect(teamIdsAfter).toContain(TEST_TEAM_C_ID);
    expect(teamIdsAfter).not.toContain(TEST_TEAM_B_ID); // Should not have Team B
  });
});
