import { runQuery } from "../../db/mysqlRunQuery";
import { getConnection } from "../../db/mysqlConnection";
import { upsertSeasonTeamRegistrationPlayer } from "../../models/season-team-registration-player.models";
import { updatePlayersForSeasonTeamRegistration } from "../../models/season-team-registration.models";
import type {
  SeasonTeamRegistrationPlayer,
  UpdateSeasonTeamRegistrationPlayer
} from "@eggosystem/types";

describe("SeasonTeamRegistrationPlayer Models - Captain/Co-Captain Constraint Tests", () => {
  const testSeasonId = 888;
  const testTeamId = 1337;
  const testSteamIds = {
    player1: "76561198000000888",
    player2: "76561198000000887",
    player3: "76561198000000886",
    player4: "76561198000000885"
  };

  beforeEach(async () => {
    // Clean up any existing test data
    await runQuery(
      "DELETE FROM SeasonTeamRegistrationPlayers WHERE season_id = ? AND team_id = ?",
      [testSeasonId, testTeamId]
    );
    await runQuery(
      "DELETE FROM SeasonTeamRegistrations WHERE season_id = ? AND team_id = ?",
      [testSeasonId, testTeamId]
    );
    await runQuery("DELETE FROM SteamPlayers WHERE steam_id IN (?, ?, ?, ?)", [
      testSteamIds.player1,
      testSteamIds.player2,
      testSteamIds.player3,
      testSteamIds.player4
    ]);
    await runQuery("DELETE FROM Accounts WHERE id IN (888, 887, 886, 885)");

    // Set up test data
    await runQuery(
      "INSERT INTO Seasons (id, game_id, name, full_name, start_date, end_date, platform) VALUES (?, 1, 'Test Season', 'Test Season Full Name', NOW(), NOW(), 'kanaliiga')",
      [testSeasonId]
    );
    await runQuery(
      "INSERT INTO Teams (id, name) VALUES (?, 'Test Team 1337')",
      [testTeamId]
    );
    await runQuery(
      "INSERT INTO SeasonTeamRegistrations (season_id, team_id, approved, terms_and_conditions_approved) VALUES (?, ?, 1, TRUE)",
      [testSeasonId, testTeamId]
    );

    // Create test players
    const testPlayers = [
      { accountId: 888, steamId: testSteamIds.player1, nickname: "Player1" },
      { accountId: 887, steamId: testSteamIds.player2, nickname: "Player2" },
      { accountId: 886, steamId: testSteamIds.player3, nickname: "Player3" },
      { accountId: 885, steamId: testSteamIds.player4, nickname: "Player4" }
    ];

    for (const player of testPlayers) {
      await runQuery(
        "INSERT INTO Accounts (id, work_email, full_name) VALUES (?, ?, ?)",
        [
          player.accountId,
          `test${player.accountId}@example.com`,
          player.nickname
        ]
      );
      await runQuery(
        "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (?, ?)",
        [player.steamId, player.nickname]
      );
      await runQuery(
        "INSERT INTO LinkedAccounts (account_id, provider, provider_id) VALUES (?, 'steam', ?)",
        [player.accountId, player.steamId]
      );
    }
  });

  afterEach(async () => {
    // Clean up test data
    await runQuery(
      "DELETE FROM SeasonTeamRegistrationPlayers WHERE season_id = ? AND team_id = ?",
      [testSeasonId, testTeamId]
    );
    await runQuery(
      "DELETE FROM SeasonTeamRegistrations WHERE season_id = ? AND team_id = ?",
      [testSeasonId, testTeamId]
    );
    await runQuery("DELETE FROM SteamPlayers WHERE steam_id IN (?, ?, ?, ?)", [
      testSteamIds.player1,
      testSteamIds.player2,
      testSteamIds.player3,
      testSteamIds.player4
    ]);
    await runQuery("DELETE FROM Accounts WHERE id IN (888, 887, 886, 885)");
    await runQuery("DELETE FROM Seasons WHERE id = ?", [testSeasonId]);
    await runQuery("DELETE FROM Teams WHERE id = ?", [testTeamId]);
  });

  describe("upsertSeasonTeamRegistrationPlayer", () => {
    it("should insert new player with captain status", async () => {
      const connection = await getConnection();

      try {
        await connection.beginTransaction();

        await upsertSeasonTeamRegistrationPlayer(
          testSeasonId,
          testTeamId,
          {
            steam_id: testSteamIds.player1,
            is_captain: true,
            is_co_captain: false
          },
          connection
        );

        await connection.commit();

        // Verify the player was inserted correctly
        const [player] = await runQuery<
          Array<{ is_captain: boolean; is_co_captain: boolean }>
        >(
          "SELECT * FROM SeasonTeamRegistrationPlayers WHERE season_id = ? AND team_id = ? AND steam_id = ?",
          [testSeasonId, testTeamId, testSteamIds.player1]
        );

        expect(player).toBeDefined();
        expect(player.is_captain).toBe(true);
        expect(player.is_co_captain).toBe(false);
      } finally {
        connection.release();
      }
    });

    it("should update existing player's captain status", async () => {
      const connection = await getConnection();

      try {
        await connection.beginTransaction();

        // First, insert a player as non-captain
        await upsertSeasonTeamRegistrationPlayer(
          testSeasonId,
          testTeamId,
          {
            steam_id: testSteamIds.player1,
            is_captain: false,
            is_co_captain: false
          },
          connection
        );

        // Then, update the same player to be captain
        await upsertSeasonTeamRegistrationPlayer(
          testSeasonId,
          testTeamId,
          {
            steam_id: testSteamIds.player1,
            is_captain: true,
            is_co_captain: false
          },
          connection
        );

        await connection.commit();

        // Verify the player was updated correctly
        const [player] = await runQuery<
          Array<{ is_captain: boolean; is_co_captain: boolean }>
        >(
          "SELECT * FROM SeasonTeamRegistrationPlayers WHERE season_id = ? AND team_id = ? AND steam_id = ?",
          [testSeasonId, testTeamId, testSteamIds.player1]
        );

        expect(player).toBeDefined();
        expect(player.is_captain).toBe(true);
        expect(player.is_co_captain).toBe(false);
      } finally {
        connection.release();
      }
    });

    it("should handle multiple captain changes in transaction without constraint violations", async () => {
      const connection = await getConnection();

      try {
        await connection.beginTransaction();

        // Insert initial players
        await upsertSeasonTeamRegistrationPlayer(
          testSeasonId,
          testTeamId,
          {
            steam_id: testSteamIds.player1,
            is_captain: true,
            is_co_captain: false
          },
          connection
        );

        await upsertSeasonTeamRegistrationPlayer(
          testSeasonId,
          testTeamId,
          {
            steam_id: testSteamIds.player2,
            is_captain: false,
            is_co_captain: true
          },
          connection
        );

        // Change captain assignment
        await upsertSeasonTeamRegistrationPlayer(
          testSeasonId,
          testTeamId,
          {
            steam_id: testSteamIds.player1,
            is_captain: false,
            is_co_captain: false
          },
          connection
        );

        await upsertSeasonTeamRegistrationPlayer(
          testSeasonId,
          testTeamId,
          {
            steam_id: testSteamIds.player2,
            is_captain: true,
            is_co_captain: false
          },
          connection
        );

        await connection.commit();

        // Verify final state
        const players = await runQuery<
          Array<{
            steam_id: string;
            is_captain: boolean;
            is_co_captain: boolean;
          }>
        >(
          "SELECT * FROM SeasonTeamRegistrationPlayers WHERE season_id = ? AND team_id = ? ORDER BY steam_id",
          [testSeasonId, testTeamId]
        );

        expect(players).toHaveLength(2);

        const player1 = players.find(
          (p) => p.steam_id === testSteamIds.player1
        );
        const player2 = players.find(
          (p) => p.steam_id === testSteamIds.player2
        );

        expect(player1?.is_captain).toBe(false);
        expect(player1?.is_co_captain).toBe(false);
        expect(player2?.is_captain).toBe(true);
        expect(player2?.is_co_captain).toBe(false);
      } finally {
        connection.release();
      }
    });
  });

  describe("updatePlayersForSeasonTeamRegistration - Captain Constraint Tests", () => {
    beforeEach(async () => {
      // Set up initial players
      await runQuery(
        "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (?, ?, ?, ?, ?)",
        [testSeasonId, testTeamId, testSteamIds.player1, 1, 0]
      );
      await runQuery(
        "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (?, ?, ?, ?, ?)",
        [testSeasonId, testTeamId, testSteamIds.player2, 0, 1]
      );
      await runQuery(
        "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (?, ?, ?, ?, ?)",
        [testSeasonId, testTeamId, testSteamIds.player3, 0, 0]
      );
    });

    it("should handle captain reassignment without constraint violations", async () => {
      const connection = await getConnection();

      try {
        await connection.beginTransaction();

        const playerUpdateData: UpdateSeasonTeamRegistrationPlayer[] = [
          {
            steam_id: testSteamIds.player1,
            is_captain: false,
            is_co_captain: false
          },
          {
            steam_id: testSteamIds.player2,
            is_captain: true,
            is_co_captain: false
          },
          {
            steam_id: testSteamIds.player3,
            is_captain: false,
            is_co_captain: true
          }
        ];

        await updatePlayersForSeasonTeamRegistration(
          testSeasonId,
          testTeamId,
          playerUpdateData,
          connection
        );

        await connection.commit();

        // Verify the changes were applied correctly
        const players = await runQuery<
          Array<{
            steam_id: string;
            is_captain: boolean;
            is_co_captain: boolean;
          }>
        >(
          "SELECT * FROM SeasonTeamRegistrationPlayers WHERE season_id = ? AND team_id = ? ORDER BY steam_id",
          [testSeasonId, testTeamId]
        );

        expect(players).toHaveLength(3);

        const player1 = players.find(
          (p) => p.steam_id === testSteamIds.player1
        );
        const player2 = players.find(
          (p) => p.steam_id === testSteamIds.player2
        );
        const player3 = players.find(
          (p) => p.steam_id === testSteamIds.player3
        );

        expect(player1?.is_captain).toBe(false);
        expect(player1?.is_co_captain).toBe(false);
        expect(player2?.is_captain).toBe(true);
        expect(player2?.is_co_captain).toBe(false);
        expect(player3?.is_captain).toBe(false);
        expect(player3?.is_co_captain).toBe(true);
      } finally {
        connection.release();
      }
    });

    it("should handle multiple captain changes in single update without errors", async () => {
      const connection = await getConnection();

      try {
        await connection.beginTransaction();

        // Test scenario: swap captain and co-captain roles
        const playerUpdateData: UpdateSeasonTeamRegistrationPlayer[] = [
          {
            steam_id: testSteamIds.player1,
            is_captain: false,
            is_co_captain: true
          },
          {
            steam_id: testSteamIds.player2,
            is_captain: true,
            is_co_captain: false
          },
          {
            steam_id: testSteamIds.player3,
            is_captain: false,
            is_co_captain: false
          }
        ];

        await updatePlayersForSeasonTeamRegistration(
          testSeasonId,
          testTeamId,
          playerUpdateData,
          connection
        );

        await connection.commit();

        // Verify the role swap was successful
        const players = await runQuery<Array<SeasonTeamRegistrationPlayer>>(
          "SELECT * FROM SeasonTeamRegistrationPlayers WHERE season_id = ? AND team_id = ? ORDER BY steam_id",
          [testSeasonId, testTeamId]
        );

        expect(players).toHaveLength(3);

        const player1 = players.find(
          (p) => p.steam_id === testSteamIds.player1
        );
        const player2 = players.find(
          (p) => p.steam_id === testSteamIds.player2
        );
        const player3 = players.find(
          (p) => p.steam_id === testSteamIds.player3
        );

        expect(player1?.is_captain).toBe(false);
        expect(player1?.is_co_captain).toBe(true);
        expect(player2?.is_captain).toBe(true);
        expect(player2?.is_co_captain).toBe(false);
        expect(player3?.is_captain).toBe(false);
        expect(player3?.is_co_captain).toBe(false);
      } finally {
        connection.release();
      }
    });

    it("should handle adding new captain while removing old captain", async () => {
      const connection = await getConnection();

      try {
        await connection.beginTransaction();

        // Add a new player as captain while removing the old captain
        const playerUpdateData: UpdateSeasonTeamRegistrationPlayer[] = [
          {
            steam_id: testSteamIds.player1,
            is_captain: false,
            is_co_captain: false
          },
          {
            steam_id: testSteamIds.player2,
            is_captain: false,
            is_co_captain: true
          },
          {
            steam_id: testSteamIds.player3,
            is_captain: false,
            is_co_captain: false
          },
          {
            steam_id: testSteamIds.player4,
            is_captain: true,
            is_co_captain: false
          }
        ];
        await updatePlayersForSeasonTeamRegistration(
          testSeasonId,
          testTeamId,
          playerUpdateData,
          connection
        );

        await connection.commit();

        // Verify the new captain assignment
        const players = await runQuery<Array<SeasonTeamRegistrationPlayer>>(
          "SELECT * FROM SeasonTeamRegistrationPlayers WHERE season_id = ? AND team_id = ? ORDER BY steam_id",
          [testSeasonId, testTeamId]
        );

        expect(players).toHaveLength(4);

        const player1 = players.find(
          (p) => p.steam_id === testSteamIds.player1
        );
        const player2 = players.find(
          (p) => p.steam_id === testSteamIds.player2
        );
        const player3 = players.find(
          (p) => p.steam_id === testSteamIds.player3
        );
        const player4 = players.find(
          (p) => p.steam_id === testSteamIds.player4
        );

        expect(player1?.is_captain).toBe(false);
        expect(player1?.is_co_captain).toBe(false);
        expect(player2?.is_captain).toBe(false);
        expect(player2?.is_co_captain).toBe(true);
        expect(player3?.is_captain).toBe(false);
        expect(player3?.is_co_captain).toBe(false);
        expect(player4?.is_captain).toBe(true);
        expect(player4?.is_co_captain).toBe(false);
      } finally {
        connection.release();
      }
    });

    it("should fail gracefully if transaction is rolled back", async () => {
      const connection = await getConnection();

      try {
        await connection.beginTransaction();

        const playerUpdateData: UpdateSeasonTeamRegistrationPlayer[] = [
          {
            steam_id: testSteamIds.player1,
            is_captain: false,
            is_co_captain: false
          },
          {
            steam_id: testSteamIds.player2,
            is_captain: true,
            is_co_captain: false
          }
        ];

        await updatePlayersForSeasonTeamRegistration(
          testSeasonId,
          testTeamId,
          playerUpdateData,
          connection
        );

        // Intentionally rollback to test cleanup
        await connection.rollback();

        // Verify that the original state is preserved
        const players = await runQuery<Array<SeasonTeamRegistrationPlayer>>(
          "SELECT * FROM SeasonTeamRegistrationPlayers WHERE season_id = ? AND team_id = ? ORDER BY steam_id",
          [testSeasonId, testTeamId]
        );

        expect(players).toHaveLength(3);

        const player1 = players.find(
          (p) => p.steam_id === testSteamIds.player1
        );
        const player2 = players.find(
          (p) => p.steam_id === testSteamIds.player2
        );

        // Should still have original captain/co-captain assignments
        expect(player1?.is_captain).toBe(true);
        expect(player1?.is_co_captain).toBe(false);
        expect(player2?.is_captain).toBe(false);
        expect(player2?.is_co_captain).toBe(true);
      } finally {
        connection.release();
      }
    });
  });
});
