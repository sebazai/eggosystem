import { getTeamsSignupApprovalState } from "./dashboard/registration.services";
import { getSeasonPlayerApproval } from "../models/season-player-approval.models";
import type {
  SeasonRegisteredTeamsWithPlayers,
  RegisteredTeamPlayer,
  SeasonPlayerApprovals
} from "@eggosystem/types";
import { SeasonPlatform } from "@eggosystem/types";

// Mock the getSeasonPlayerApproval function
jest.mock("../models/season-player-approval.models");
const mockGetSeasonPlayerApproval =
  getSeasonPlayerApproval as jest.MockedFunction<
    typeof getSeasonPlayerApproval
  >;

describe("getTeamsSignupApprovalState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockPlayer = (
    steam_id: string,
    work_email: string,
    is_work_email_personal_email: boolean = false,
    work_email_verified: boolean = true
  ): RegisteredTeamPlayer => ({
    steam_id,
    work_email,
    is_work_email_personal_email,
    work_email_verified,
    nickname: "Test Player"
  });

  const createMockTeam = (
    team_id: number,
    season_id: number,
    players: RegisteredTeamPlayer[]
  ): SeasonRegisteredTeamsWithPlayers => ({
    team_id,
    season_id,
    players,
    team_name: "Test Team",
    captain_nickname: "Captain",
    co_captain_nickname: "Co-Captain",
    season_platform: SeasonPlatform.Kanaliiga,
    approved: false,
    terms_and_conditions_approved: true,
    approved_by: null,
    manual_validity_check_override: false,
    manual_validity_check_by: null
  });

  describe("when all players have the same email ending", () => {
    it("should return team as valid without checking approvals", async () => {
      const players = [
        createMockPlayer("steam1", "player1@company.com"),
        createMockPlayer("steam2", "player2@company.com"),
        createMockPlayer("steam3", "player3@company.com")
      ];

      const team = createMockTeam(1, 1, players);
      const teams = [team];

      const result = await getTeamsSignupApprovalState(teams);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        team_id: 1,
        is_valid: true,
        invalid_players: []
      });

      // Should not call getSeasonPlayerApproval since all emails are the same
      expect(mockGetSeasonPlayerApproval).not.toHaveBeenCalled();
    });
  });

  describe("when players have unverified emails", () => {
    it("should return team as invalid when any player has unverified email", async () => {
      const players = [
        createMockPlayer("steam1", "player1@company.com", false, true), // verified
        createMockPlayer("steam2", "player2@company.com", false, false), // unverified
        createMockPlayer("steam3", "player3@company.com", false, true) // verified
      ];

      const team = createMockTeam(1, 1, players);
      const teams = [team];

      const result = await getTeamsSignupApprovalState(teams);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        team_id: 1,
        is_valid: false,
        invalid_players: [players[1]] // steam2 player with unverified email
      });

      // Should not call getSeasonPlayerApproval since team is invalid due to unverified emails
      expect(mockGetSeasonPlayerApproval).not.toHaveBeenCalled();
    });

    it("should return team as invalid when all players have unverified emails", async () => {
      const players = [
        createMockPlayer("steam1", "player1@company.com", false, false), // unverified
        createMockPlayer("steam2", "player2@company.com", false, false), // unverified
        createMockPlayer("steam3", "player3@company.com", false, false) // unverified
      ];

      const team = createMockTeam(1, 1, players);
      const teams = [team];

      const result = await getTeamsSignupApprovalState(teams);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        team_id: 1,
        is_valid: false,
        invalid_players: players // all players are invalid
      });

      // Should not call getSeasonPlayerApproval since team is invalid due to unverified emails
      expect(mockGetSeasonPlayerApproval).not.toHaveBeenCalled();
    });

    it("should return team as valid when all players have verified emails", async () => {
      const players = [
        createMockPlayer("steam1", "player1@company.com", false, true), // verified
        createMockPlayer("steam2", "player2@company.com", false, true), // verified
        createMockPlayer("steam3", "player3@company.com", false, true) // verified
      ];

      const team = createMockTeam(1, 1, players);
      const teams = [team];

      const result = await getTeamsSignupApprovalState(teams);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        team_id: 1,
        is_valid: true,
        invalid_players: []
      });

      // Should not call getSeasonPlayerApproval since all emails are the same and verified
      expect(mockGetSeasonPlayerApproval).not.toHaveBeenCalled();
    });
  });

  describe("when players have different email endings", () => {
    it("should return team as valid when all players needing approval are approved (team-level)", async () => {
      const players = [
        createMockPlayer("steam1", "player1@company.com"),
        createMockPlayer("steam2", "player2@personal.com"), // Different email
        createMockPlayer("steam3", "player3@company.com")
      ];

      const team = createMockTeam(1, 1, players);
      const teams = [team];

      // Mock that the player with different email is approved
      mockGetSeasonPlayerApproval.mockResolvedValue([
        {
          id: 1,
          steam_id: "steam2",
          season_id: 1,
          organization_id: 1,
          team_id: 1,
          approved_by_id: 1,
          approved_at: "2024-01-01T00:00:00Z",
          ticket_id: "ticket123",
          details: "Approved"
        } satisfies SeasonPlayerApprovals
      ]);

      const result = await getTeamsSignupApprovalState(teams);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        team_id: 1,
        is_valid: true,
        invalid_players: []
      });

      expect(mockGetSeasonPlayerApproval).toHaveBeenCalledTimes(1);
      expect(mockGetSeasonPlayerApproval).toHaveBeenCalledWith(1, 1, "steam2");
    });

    it("should return team as valid when all players needing approval are approved (organization-level)", async () => {
      const players = [
        createMockPlayer("steam1", "player1@company.com"),
        createMockPlayer("steam2", "player2@personal.com"), // Different email
        createMockPlayer("steam3", "player3@company.com")
      ];

      const team = createMockTeam(1, 1, players);
      const teams = [team];

      // Mock that the player with different email is approved (organization-level)
      mockGetSeasonPlayerApproval.mockResolvedValue([
        {
          id: 1,
          steam_id: "steam2",
          season_id: 1,
          organization_id: 1,
          team_id: 1,
          approved_by_id: 1,
          approved_at: "2024-01-01T00:00:00Z",
          ticket_id: "ticket123",
          details: "Approved"
        } as SeasonPlayerApprovals
      ]);

      const result = await getTeamsSignupApprovalState(teams);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        team_id: 1,
        is_valid: true,
        invalid_players: []
      });

      expect(mockGetSeasonPlayerApproval).toHaveBeenCalledTimes(1);
      expect(mockGetSeasonPlayerApproval).toHaveBeenCalledWith(1, 1, "steam2");
    });

    it("should return team as invalid when a player needing approval is not approved", async () => {
      const players = [
        createMockPlayer("steam1", "player1@company.com"),
        createMockPlayer("steam2", "player2@personal.com"), // Different email, not approved
        createMockPlayer("steam3", "player3@company.com")
      ];

      const team = createMockTeam(1, 1, players);
      const teams = [team];

      // Mock that the player with different email is NOT approved
      mockGetSeasonPlayerApproval.mockResolvedValue(undefined);

      const result = await getTeamsSignupApprovalState(teams);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        team_id: 1,
        is_valid: false,
        invalid_players: [players[1]] // steam2 player
      });

      expect(mockGetSeasonPlayerApproval).toHaveBeenCalledTimes(1);
      expect(mockGetSeasonPlayerApproval).toHaveBeenCalledWith(1, 1, "steam2");
    });

    it("should return team as invalid when multiple players needing approval are not approved", async () => {
      const players = [
        createMockPlayer("steam1", "player1@company.com"),
        createMockPlayer("steam2", "player2@personal.com"), // Different email, not approved
        createMockPlayer("steam3", "player3@another.com") // Different email, not approved
      ];

      const team = createMockTeam(1, 1, players);
      const teams = [team];

      // Mock that both players with different emails are NOT approved
      mockGetSeasonPlayerApproval
        .mockResolvedValueOnce(undefined) // steam2
        .mockResolvedValueOnce(undefined); // steam3

      const result = await getTeamsSignupApprovalState(teams);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        team_id: 1,
        is_valid: false,
        invalid_players: [players[1], players[2]] // steam2 and steam3 players
      });

      expect(mockGetSeasonPlayerApproval).toHaveBeenCalledTimes(2);
      expect(mockGetSeasonPlayerApproval).toHaveBeenNthCalledWith(
        1,
        1,
        1,
        "steam2"
      );
      expect(mockGetSeasonPlayerApproval).toHaveBeenNthCalledWith(
        2,
        1,
        1,
        "steam3"
      );
    });

    it("should return team as invalid when one player is approved and another is not", async () => {
      const players = [
        createMockPlayer("steam1", "player1@company.com"),
        createMockPlayer("steam2", "player2@personal.com"), // Different email, approved
        createMockPlayer("steam3", "player3@another.com") // Different email, not approved
      ];

      const team = createMockTeam(1, 1, players);
      const teams = [team];

      // Mock that one player is approved, one is not
      mockGetSeasonPlayerApproval
        .mockResolvedValueOnce([
          {
            id: 1,
            steam_id: "steam2",
            season_id: 1,
            organization_id: 1,
            team_id: 1,
            approved_by_id: 1,
            approved_at: "2024-01-01T00:00:00Z",
            ticket_id: "ticket123",
            details: "Approved"
          } as SeasonPlayerApprovals
        ]) // steam2 approved
        .mockResolvedValueOnce(undefined); // steam3 not approved

      const result = await getTeamsSignupApprovalState(teams);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        team_id: 1,
        is_valid: false,
        invalid_players: [players[2]] // Only steam3 player (not approved)
      });

      expect(mockGetSeasonPlayerApproval).toHaveBeenCalledTimes(2);
      expect(mockGetSeasonPlayerApproval).toHaveBeenNthCalledWith(
        1,
        1,
        1,
        "steam2"
      );
      expect(mockGetSeasonPlayerApproval).toHaveBeenNthCalledWith(
        2,
        1,
        1,
        "steam3"
      );
    });
  });

  describe("when all players have personal emails", () => {
    it("should return team as valid when all players needing approval are approved", async () => {
      const players = [
        createMockPlayer("steam1", "player1@gmail.com", true), // Personal email
        createMockPlayer("steam2", "player2@yahoo.com", true), // Personal email
        createMockPlayer("steam3", "player3@hotmail.com", true) // Personal email
      ];

      const team = createMockTeam(1, 1, players);
      const teams = [team];

      // Mock that all players are approved
      mockGetSeasonPlayerApproval
        .mockResolvedValueOnce([
          {
            id: 1,
            steam_id: "steam1",
            season_id: 1,
            organization_id: 1,
            team_id: 1,
            approved_by_id: 1,
            approved_at: "2024-01-01T00:00:00Z",
            ticket_id: "ticket123",
            details: "Approved"
          } as SeasonPlayerApprovals
        ])
        .mockResolvedValueOnce([
          {
            id: 2,
            steam_id: "steam2",
            season_id: 1,
            organization_id: 1,
            team_id: 1,
            approved_by_id: 1,
            approved_at: "2024-01-01T00:00:00Z",
            ticket_id: "ticket123",
            details: "Approved"
          } as SeasonPlayerApprovals
        ])
        .mockResolvedValueOnce([
          {
            id: 3,
            steam_id: "steam3",
            season_id: 1,
            organization_id: 1,
            team_id: 1,
            approved_by_id: 1,
            approved_at: "2024-01-01T00:00:00Z",
            ticket_id: "ticket123",
            details: "Approved"
          } as SeasonPlayerApprovals
        ]);

      const result = await getTeamsSignupApprovalState(teams);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        team_id: 1,
        is_valid: true,
        invalid_players: []
      });

      expect(mockGetSeasonPlayerApproval).toHaveBeenCalledTimes(3);
    });

    it("should return team as invalid when any player needing approval is not approved", async () => {
      const players = [
        createMockPlayer("steam1", "player1@gmail.com", true), // Personal email, approved
        createMockPlayer("steam2", "player2@yahoo.com", true), // Personal email, not approved
        createMockPlayer("steam3", "player3@hotmail.com", true) // Personal email, approved
      ];

      const team = createMockTeam(1, 1, players);
      const teams = [team];

      // Mock that one player is not approved
      mockGetSeasonPlayerApproval
        .mockResolvedValueOnce([
          {
            id: 1,
            steam_id: "steam1",
            season_id: 1,
            organization_id: 1,
            team_id: 1,
            approved_by_id: 1,
            approved_at: "2024-01-01T00:00:00Z",
            ticket_id: "ticket123",
            details: "Approved"
          } as SeasonPlayerApprovals
        ]) // steam1 approved
        .mockResolvedValueOnce(undefined) // steam2 not approved
        .mockResolvedValueOnce([
          {
            id: 3,
            steam_id: "steam3",
            season_id: 1,
            organization_id: 1,
            team_id: 1,
            approved_by_id: 1,
            approved_at: "2024-01-01T00:00:00Z",
            ticket_id: "ticket123",
            details: "Approved"
          } as SeasonPlayerApprovals
        ]); // steam3 approved

      const result = await getTeamsSignupApprovalState(teams);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        team_id: 1,
        is_valid: false,
        invalid_players: [players[1]] // steam2 player
      });

      expect(mockGetSeasonPlayerApproval).toHaveBeenCalledTimes(3);
    });
  });

  describe("multiple teams", () => {
    it("should process multiple teams in parallel", async () => {
      const team1Players = [
        createMockPlayer("steam1", "player1@company.com"),
        createMockPlayer("steam2", "player2@personal.com") // Different email
      ];

      const team2Players = [
        createMockPlayer("steam3", "player3@company.com"),
        createMockPlayer("steam4", "player4@another.com") // Different email
      ];

      const team1 = createMockTeam(1, 1, team1Players);
      const team2 = createMockTeam(2, 1, team2Players);
      const teams = [team1, team2];

      // Mock approvals
      mockGetSeasonPlayerApproval
        .mockResolvedValueOnce([
          {
            id: 1,
            steam_id: "steam2",
            season_id: 1,
            organization_id: 1,
            team_id: 1,
            approved_by_id: 1,
            approved_at: "2024-01-01T00:00:00Z",
            ticket_id: "ticket123",
            details: "Approved"
          } as SeasonPlayerApprovals
        ]) // steam2 approved
        .mockResolvedValueOnce(undefined); // steam4 not approved

      const result = await getTeamsSignupApprovalState(teams);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        team_id: 1,
        is_valid: true,
        invalid_players: []
      });
      expect(result[1]).toEqual({
        team_id: 2,
        is_valid: false,
        invalid_players: [team2Players[1]] // steam4 player
      });

      expect(mockGetSeasonPlayerApproval).toHaveBeenCalledTimes(2);
      expect(mockGetSeasonPlayerApproval).toHaveBeenNthCalledWith(
        1,
        1,
        1,
        "steam2"
      );
      expect(mockGetSeasonPlayerApproval).toHaveBeenNthCalledWith(
        2,
        1,
        2,
        "steam4"
      );
    });
  });

  describe("edge cases", () => {
    it("should handle empty teams array", async () => {
      const result = await getTeamsSignupApprovalState([]);

      expect(result).toEqual([]);
      expect(mockGetSeasonPlayerApproval).not.toHaveBeenCalled();
    });

    it("should handle team with no players", async () => {
      const team = createMockTeam(1, 1, []);
      const teams = [team];

      const result = await getTeamsSignupApprovalState(teams);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        team_id: 1,
        is_valid: true,
        invalid_players: []
      });

      expect(mockGetSeasonPlayerApproval).not.toHaveBeenCalled();
    });

    it("should handle team with single player", async () => {
      const players = [createMockPlayer("steam1", "player1@company.com")];
      const team = createMockTeam(1, 1, players);
      const teams = [team];

      const result = await getTeamsSignupApprovalState(teams);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        team_id: 1,
        is_valid: true,
        invalid_players: []
      });

      expect(mockGetSeasonPlayerApproval).not.toHaveBeenCalled();
    });

    it("should handle empty approval result array", async () => {
      const players = [
        createMockPlayer("steam1", "player1@company.com"),
        createMockPlayer("steam2", "player2@personal.com") // Different email
      ];

      const team = createMockTeam(1, 1, players);
      const teams = [team];

      // Mock empty array result (edge case)
      mockGetSeasonPlayerApproval.mockResolvedValue([]);

      const result = await getTeamsSignupApprovalState(teams);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        team_id: 1,
        is_valid: false,
        invalid_players: [players[1]] // steam2 player
      });

      expect(mockGetSeasonPlayerApproval).toHaveBeenCalledTimes(1);
    });
  });
});
