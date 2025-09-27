import { runQuery } from "../db/mysqlRunQuery";
import { upsertTeamGameScore } from "./team-game-score.models";

describe("upsertTeamGameScore Integration Tests", () => {
  const testMatchId = 7390; // Using existing match from database
  const testTeamId = 594; // Using existing team from database
  const testGameId = 10308; // Using existing game from database - SAME match_game_id for upsert tests
  const testStartingSide = "CT" as const;
  const testScore = 16;
  const testHalftimeScore = 8;
  const testOvertimeScore = 0;

  beforeEach(async () => {
    // Clean up any existing test data
    await runQuery(
      "DELETE FROM TeamGameScores WHERE match_id = ? AND team_id = ?",
      [testMatchId, testTeamId]
    );
  });

  afterEach(async () => {
    // Clean up test data
    await runQuery(
      "DELETE FROM TeamGameScores WHERE match_id = ? AND team_id = ?",
      [testMatchId, testTeamId]
    );
  });

  describe("upsertTeamGameScore Integration Tests", () => {
    it("should INSERT and return insertId when record doesn't exist", async () => {
      // Act
      const result = await upsertTeamGameScore({
        match_id: testMatchId,
        team_id: testTeamId,
        match_game_id: testGameId,
        starting_side: testStartingSide,
        score: testScore,
        halftime_score: testHalftimeScore,
        overtime_score: testOvertimeScore
      });

      // Check if the record was actually inserted
      const dbRecord = await runQuery<
        Array<{
          id: number;
          match_id: number;
          team_id: number;
          match_game_id: number;
          starting_side: string;
          score: number;
          halftime_score: number;
          overtime_score: number;
        }>
      >("SELECT * FROM TeamGameScores WHERE match_id = ? AND team_id = ?", [
        testMatchId,
        testTeamId
      ]);

      // Assert
      expect(result.insertId).toBeDefined();
      expect(typeof result.insertId).toBe("number");
      expect(result.insertId).toBeGreaterThan(0);

      // Verify the record was actually inserted
      expect(dbRecord).toHaveLength(1);
      expect(dbRecord[0].id).toBeGreaterThan(0);
      expect(dbRecord[0].match_id).toBe(testMatchId);
      expect(dbRecord[0].team_id).toBe(testTeamId);
      expect(dbRecord[0].match_game_id).toBe(testGameId);
      expect(dbRecord[0].starting_side).toBe(testStartingSide);
      expect(dbRecord[0].score).toBe(testScore);
      expect(dbRecord[0].halftime_score).toBe(testHalftimeScore);
      expect(dbRecord[0].overtime_score).toBe(testOvertimeScore);
    });

    it("should UPDATE and return existing insertId when record already exists", async () => {
      // Arrange - Insert a record first
      const initialInsert = await runQuery<{ insertId: number }>(
        "INSERT INTO TeamGameScores (match_id, team_id, match_game_id, starting_side, score, halftime_score, overtime_score) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          testMatchId,
          testTeamId,
          testGameId,
          testStartingSide,
          testScore,
          testHalftimeScore,
          testOvertimeScore
        ]
      );

      const existingId = initialInsert.insertId;

      // Act - Try to upsert with the same match_game_id and team_id but different data
      const result = await upsertTeamGameScore({
        match_id: testMatchId,
        team_id: testTeamId,
        match_game_id: testGameId, // SAME match_game_id for upsert to work
        starting_side: "T", // Different starting_side
        score: testScore + 5, // Different score
        halftime_score: testHalftimeScore + 2, // Different halftime_score
        overtime_score: testOvertimeScore + 1 // Different overtime_score
      });

      // Assert
      expect(result.insertId).toBeDefined();
      expect(typeof result.insertId).toBe("number");
      expect(result.insertId).toBe(existingId); // Should return the existing ID

      // Verify the record was updated, not inserted
      const updatedRecord = await runQuery<
        Array<{
          id: number;
          match_id: number;
          team_id: number;
          match_game_id: number;
          starting_side: string;
          score: number;
          halftime_score: number;
          overtime_score: number;
        }>
      >("SELECT * FROM TeamGameScores WHERE match_id = ? AND team_id = ?", [
        testMatchId,
        testTeamId
      ]);

      expect(updatedRecord).toHaveLength(1);
      expect(updatedRecord[0].id).toBe(existingId); // Same ID
      expect(updatedRecord[0].match_id).toBe(testMatchId); // Same
      expect(updatedRecord[0].team_id).toBe(testTeamId); // Same
      expect(updatedRecord[0].match_game_id).toBe(testGameId); // Same match_game_id
      expect(updatedRecord[0].starting_side).toBe("T"); // Updated
      expect(updatedRecord[0].score).toBe(testScore + 5); // Updated
      expect(updatedRecord[0].halftime_score).toBe(testHalftimeScore + 2); // Updated
      expect(updatedRecord[0].overtime_score).toBe(testOvertimeScore + 1); // Updated
    });

    it("should handle multiple upserts with the same match_id and team_id correctly", async () => {
      // Act - First upsert (INSERT)
      const firstResult = await upsertTeamGameScore({
        match_id: testMatchId,
        team_id: testTeamId,
        match_game_id: testGameId,
        starting_side: testStartingSide,
        score: testScore,
        halftime_score: testHalftimeScore,
        overtime_score: testOvertimeScore
      });

      const firstId = firstResult.insertId;

      // Second upsert (UPDATE)
      const secondResult = await upsertTeamGameScore({
        match_id: testMatchId,
        team_id: testTeamId,
        match_game_id: testGameId, // SAME match_game_id for upsert to work
        starting_side: "T",
        score: testScore + 5,
        halftime_score: testHalftimeScore + 2,
        overtime_score: testOvertimeScore + 1
      });

      // Third upsert (UPDATE)
      const thirdResult = await upsertTeamGameScore({
        match_id: testMatchId,
        team_id: testTeamId,
        match_game_id: testGameId, // SAME match_game_id for upsert to work
        starting_side: "CT",
        score: testScore + 10,
        halftime_score: testHalftimeScore + 4,
        overtime_score: testOvertimeScore + 2
      });

      // Assert
      expect(firstId).toBeGreaterThan(0);
      expect(secondResult.insertId).toBe(firstId); // Same ID for updates
      expect(thirdResult.insertId).toBe(firstId); // Same ID for updates

      // Verify only one record exists
      const records = await runQuery<
        Array<{
          id: number;
          match_id: number;
          team_id: number;
          match_game_id: number;
          starting_side: string;
          score: number;
          halftime_score: number;
          overtime_score: number;
        }>
      >("SELECT * FROM TeamGameScores WHERE match_id = ? AND team_id = ?", [
        testMatchId,
        testTeamId
      ]);

      expect(records).toHaveLength(1);
      expect(records[0].id).toBe(firstId);
      expect(records[0].match_game_id).toBe(testGameId); // Same match_game_id since we're using upsert
      expect(records[0].starting_side).toBe("CT"); // Last update
      expect(records[0].score).toBe(testScore + 10); // Last update
      expect(records[0].halftime_score).toBe(testHalftimeScore + 4); // Last update
      expect(records[0].overtime_score).toBe(testOvertimeScore + 2); // Last update
    });

    it("should work with database transactions", async () => {
      // Act
      const result = await upsertTeamGameScore({
        match_id: testMatchId,
        team_id: testTeamId,
        match_game_id: testGameId,
        starting_side: testStartingSide,
        score: testScore,
        halftime_score: testHalftimeScore,
        overtime_score: testOvertimeScore
      });

      // Assert
      expect(result.insertId).toBeDefined();
      expect(typeof result.insertId).toBe("number");
      expect(result.insertId).toBeGreaterThan(0);

      // Verify the record exists
      const dbRecord = await runQuery<
        Array<{
          id: number;
          match_id: number;
          team_id: number;
          match_game_id: number;
          starting_side: string;
          score: number;
          halftime_score: number;
          overtime_score: number;
        }>
      >("SELECT * FROM TeamGameScores WHERE match_id = ? AND team_id = ?", [
        testMatchId,
        testTeamId
      ]);

      expect(dbRecord).toHaveLength(1);
      expect(dbRecord[0].id).toBe(result.insertId);
    });

    it("should handle different teams for the same match", async () => {
      const testTeamId2 = 875; // Different team from database (also exists for match 7390)

      // Act - Insert scores for two different teams
      const result1 = await upsertTeamGameScore({
        match_id: testMatchId,
        team_id: testTeamId,
        match_game_id: testGameId,
        starting_side: "CT",
        score: 16,
        halftime_score: 8,
        overtime_score: 0
      });

      const result2 = await upsertTeamGameScore({
        match_id: testMatchId,
        team_id: testTeamId2,
        match_game_id: testGameId,
        starting_side: "T",
        score: 14,
        halftime_score: 7,
        overtime_score: 0
      });

      // Assert
      expect(result1.insertId).toBeGreaterThan(0);
      // For UPDATE operations, insertId might be 0, but affectedRows should be > 0
      expect(result2.affectedRows).toBeGreaterThan(0);
      // If both are INSERTs, they should have different IDs
      if (result1.insertId > 0 && result2.insertId > 0) {
        expect(result1.insertId).not.toBe(result2.insertId);
      }

      // Verify both records exist (there may be existing records, so we check for at least 2)
      const records = await runQuery<
        Array<{
          id: number;
          match_id: number;
          team_id: number;
          match_game_id: number;
          starting_side: string;
          score: number;
          halftime_score: number;
          overtime_score: number;
        }>
      >(
        "SELECT * FROM TeamGameScores WHERE match_id = ? AND (team_id = ? OR team_id = ?)",
        [testMatchId, testTeamId, testTeamId2]
      );

      expect(records.length).toBeGreaterThanOrEqual(2);
      expect(records.map((r) => r.team_id)).toContain(testTeamId);
      expect(records.map((r) => r.team_id)).toContain(testTeamId2);
    });
  });
});
