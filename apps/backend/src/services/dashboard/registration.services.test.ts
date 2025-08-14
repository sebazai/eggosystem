import { getTeamsSignupApprovalState } from "./registration.services";
import { runQuery } from "../../db/mysqlRunQuery";
import { getSeasonPlayerApproval } from "../../models/season-player-approval.models";
import { SeasonPlatform } from "@eggosystem/types";

// Mock dependencies
jest.mock("../../db/mysqlRunQuery");
jest.mock("../../models/season-player-approval.models");

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockGetSeasonPlayerApproval =
  getSeasonPlayerApproval as jest.MockedFunction<
    typeof getSeasonPlayerApproval
  >;

describe("registration.services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTeamsSignupApprovalState", () => {
    const mockTeam = {
      season_id: 1,
      team_id: 123,
      team_name: "Test Team",
      approved: false,
      terms_and_conditions_approved: true,
      external_platform_id: null,
      season_platform: SeasonPlatform.Kanaliiga,
      captain_nickname: "Captain",
      co_captain_nickname: "CoCaptain",
      approved_by: null,
      manual_validity_check_override: false,
      manual_validity_check_by: null,
      players: [
        {
          steam_id: "76561198012345678",
          nickname: "Player1",
          work_email: "player1@company.com",
          is_work_email_personal_email: false
        },
        {
          steam_id: "76561198087654321",
          nickname: "Player2",
          work_email: "player2@company.com",
          is_work_email_personal_email: false
        }
      ]
    };

    describe("manual validity override", () => {
      it("should return valid team when manual_validity_check_override is true", async () => {
        // Mock the override query to return true
        mockRunQuery.mockResolvedValueOnce([
          { manual_validity_check_override: true }
        ]);

        const result = await getTeamsSignupApprovalState([mockTeam]);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          team_id: 123,
          is_valid: true,
          invalid_players: []
        });

        // Verify the override query was called
        expect(mockRunQuery).toHaveBeenCalledWith(
          expect.stringContaining("SELECT manual_validity_check_override"),
          [1, 123]
        );

        // Verify no other validation logic was called
        expect(mockGetSeasonPlayerApproval).not.toHaveBeenCalled();
      });

      it("should return valid team when manual_validity_check_override is true even with invalid players", async () => {
        const teamWithInvalidPlayers = {
          ...mockTeam,
          players: [
            {
              steam_id: "76561198012345678",
              nickname: "Player1",
              work_email: "player1@gmail.com", // Personal email
              is_work_email_personal_email: true
            }
          ]
        };

        // Mock the override query to return true
        mockRunQuery.mockResolvedValueOnce([
          { manual_validity_check_override: true }
        ]);

        const result = await getTeamsSignupApprovalState([
          teamWithInvalidPlayers
        ]);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          team_id: 123,
          is_valid: true,
          invalid_players: []
        });

        // Verify no approval checks were made
        expect(mockGetSeasonPlayerApproval).not.toHaveBeenCalled();
      });

      it("should return valid team when manual_validity_check_override is true even with personal email domain", async () => {
        const teamWithPersonalDomain = {
          ...mockTeam,
          players: [
            {
              steam_id: "76561198012345678",
              nickname: "Player1",
              work_email: "player1@gmail.com",
              is_work_email_personal_email: false
            }
          ]
        };

        // Mock the override query to return true
        mockRunQuery.mockResolvedValueOnce([
          { manual_validity_check_override: true }
        ]);

        const result = await getTeamsSignupApprovalState([
          teamWithPersonalDomain
        ]);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          team_id: 123,
          is_valid: true,
          invalid_players: []
        });
      });

      it("should proceed with normal validation when manual_validity_check_override is false", async () => {
        // Mock the override query to return false
        mockRunQuery.mockResolvedValueOnce([
          { manual_validity_check_override: false }
        ]);

        // Mock other validation logic
        mockRunQuery.mockResolvedValueOnce([]); // isPersonalEmailDomain returns empty array

        const result = await getTeamsSignupApprovalState([mockTeam]);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          team_id: 123,
          is_valid: true,
          invalid_players: []
        });

        // Verify the override query was called
        expect(mockRunQuery).toHaveBeenCalledWith(
          expect.stringContaining("SELECT manual_validity_check_override"),
          [1, 123]
        );
      });

      it("should proceed with normal validation when manual_validity_check_override is null", async () => {
        // Mock the override query to return null
        mockRunQuery.mockResolvedValueOnce([
          { manual_validity_check_override: null }
        ]);

        // Mock other validation logic
        mockRunQuery.mockResolvedValueOnce([]); // isPersonalEmailDomain returns empty array

        const result = await getTeamsSignupApprovalState([mockTeam]);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          team_id: 123,
          is_valid: true,
          invalid_players: []
        });
      });

      it("should proceed with normal validation when no registration record exists", async () => {
        // Mock the override query to return empty array
        mockRunQuery.mockResolvedValueOnce([]);

        // Mock other validation logic
        mockRunQuery.mockResolvedValueOnce([]); // isPersonalEmailDomain returns empty array

        const result = await getTeamsSignupApprovalState([mockTeam]);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          team_id: 123,
          is_valid: true,
          invalid_players: []
        });
      });
    });

    describe("normal validation logic (when override is false)", () => {
      beforeEach(() => {
        // Mock override to return false by default
        mockRunQuery.mockResolvedValueOnce([
          { manual_validity_check_override: false }
        ]);
      });

      it("should return valid team when no players", async () => {
        const teamWithNoPlayers = {
          ...mockTeam,
          players: []
        };

        const result = await getTeamsSignupApprovalState([teamWithNoPlayers]);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          team_id: 123,
          is_valid: true,
          invalid_players: []
        });
      });

      it("should handle teams with all personal emails", async () => {
        const teamWithPersonalEmails = {
          ...mockTeam,
          players: [
            {
              steam_id: "76561198012345678",
              nickname: "Player1",
              work_email: "player1@gmail.com",
              is_work_email_personal_email: true
            }
          ]
        };

        // Mock approval check to return approved
        mockGetSeasonPlayerApproval.mockResolvedValue([
          {
            approved_by_id: 1,
            approved_at: "2024-01-01T00:00:00Z",
            id: 0,
            steam_id: "",
            season_id: 0,
            organization_id: 0,
            team_id: 0,
            ticket_id: "",
            details: ""
          }
        ]);

        const result = await getTeamsSignupApprovalState([
          teamWithPersonalEmails
        ]);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          team_id: 123,
          is_valid: true,
          invalid_players: []
        });

        expect(mockGetSeasonPlayerApproval).toHaveBeenCalledWith(
          1,
          123,
          "76561198012345678"
        );
      });

      it("should handle teams with mixed email domains", async () => {
        const teamWithMixedEmails = {
          ...mockTeam,
          players: [
            {
              steam_id: "76561198012345678",
              nickname: "Player1",
              work_email: "player1@company.com",
              is_work_email_personal_email: false
            },
            {
              steam_id: "76561198087654321",
              nickname: "Player2",
              work_email: "player2@othercompany.com",
              is_work_email_personal_email: false
            }
          ]
        };

        // Mock approval checks
        mockGetSeasonPlayerApproval
          .mockResolvedValueOnce([]) // Player2 not approved
          .mockResolvedValueOnce([
            {
              approved_by_id: 1,
              approved_at: "2024-01-01T00:00:00Z",
              id: 0,
              steam_id: "",
              season_id: 0,
              organization_id: 0,
              team_id: 0,
              ticket_id: "",
              details: ""
            }
          ]); // Player1 approved

        const result = await getTeamsSignupApprovalState([teamWithMixedEmails]);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          team_id: 123,
          is_valid: false,
          invalid_players: [teamWithMixedEmails.players[1]]
        });
      });
    });

    describe("error handling", () => {
      it("should handle database errors gracefully", async () => {
        mockRunQuery.mockRejectedValueOnce(new Error("Database error"));

        await expect(getTeamsSignupApprovalState([mockTeam])).rejects.toThrow(
          "Database error"
        );
      });

      it("should handle multiple teams with different override states", async () => {
        const team1 = { ...mockTeam, team_id: 1 };
        const team2 = { ...mockTeam, team_id: 2 };

        // Team1 has override, Team2 doesn't
        mockRunQuery
          .mockResolvedValueOnce([{ manual_validity_check_override: true }]) // Team1
          .mockResolvedValueOnce([{ manual_validity_check_override: false }]); // Team2

        // Mock validation for team2
        mockRunQuery.mockResolvedValueOnce([]); // isPersonalEmailDomain returns empty array

        const result = await getTeamsSignupApprovalState([team1, team2]);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          team_id: 1,
          is_valid: true,
          invalid_players: []
        });
        expect(result[1]).toEqual({
          team_id: 2,
          is_valid: true,
          invalid_players: []
        });
      });
    });
  });
});
