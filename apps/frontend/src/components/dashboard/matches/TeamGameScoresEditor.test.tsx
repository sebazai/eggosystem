import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { ApiError, clientApiFetch } from "@/lib/apiClient";
import { TeamGameScoresEditor } from "./TeamGameScoresEditor";

jest.mock("@/lib/apiClient", () => ({
  clientApiFetch: jest.fn(),
  ApiError: class ApiError extends Error {
    detail?: string;
    issues?: Array<{ path: (string | number)[]; message: string }>;
    constructor(message: string) {
      super(message);
      this.name = "ApiError";
    }
  }
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams()
}));

const mockClientApiFetch = jest.mocked(clientApiFetch);

describe("TeamGameScoresEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads and saves team game scores", async () => {
    mockClientApiFetch
      .mockResolvedValueOnce({
        match_id: 10,
        match_game_id: 55,
        regulation_rounds: 24,
        team_game_scores_staff_lock: false,
        match_team_ids: [100, 200],
        teams: [
          {
            team_id: 100,
            starting_side: "T",
            score: 13,
            halftime_score: 6,
            overtime_score: 0
          },
          {
            team_id: 200,
            starting_side: "CT",
            score: 9,
            halftime_score: 6,
            overtime_score: 0
          }
        ]
      })
      .mockResolvedValueOnce({
        match_id: 10,
        match_game_id: 55,
        regulation_rounds: 24,
        team_game_scores_staff_lock: true,
        match_team_ids: [100, 200],
        teams: [
          {
            team_id: 100,
            starting_side: "T",
            score: 13,
            halftime_score: 6,
            overtime_score: 0
          },
          {
            team_id: 200,
            starting_side: "CT",
            score: 11,
            halftime_score: 6,
            overtime_score: 0
          }
        ]
      });

    render(<TeamGameScoresEditor />);

    fireEvent.change(screen.getByTestId("match-game-id-input"), {
      target: { value: "55" }
    });
    fireEvent.click(screen.getByTestId("load-team-game-scores"));

    await waitFor(() => {
      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/dashboard/matches/games/55/team-game-scores"
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("T-score")).toHaveValue(13);
      expect(screen.getByTestId("CT-score")).toHaveValue(9);
    });

    fireEvent.change(screen.getByTestId("CT-score"), {
      target: { value: "11" }
    });

    fireEvent.click(screen.getByTestId("save-team-game-scores"));

    await waitFor(() => {
      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/dashboard/matches/games/55/team-game-scores",
        expect.objectContaining({
          method: "PUT"
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("team-game-scores-success")).toHaveTextContent(
        "Saved"
      );
    });
  });

  it("shows ApiError detail when load fails", async () => {
    const apiError = new ApiError("x", 400);
    apiError.detail = "Bad Request";
    mockClientApiFetch.mockRejectedValueOnce(apiError);

    render(<TeamGameScoresEditor />);

    fireEvent.change(screen.getByTestId("match-game-id-input"), {
      target: { value: "55" }
    });
    fireEvent.click(screen.getByTestId("load-team-game-scores"));

    await waitFor(() => {
      expect(screen.getByTestId("team-game-scores-error")).toHaveTextContent(
        "Bad Request"
      );
    });
  });
});
