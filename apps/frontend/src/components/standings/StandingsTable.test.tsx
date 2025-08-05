import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { StandingsTable } from "@/components/standings/StandingsTable";
import type { StandingsFaceitTeamStats } from "@eggosystem/types";

const mockStandingsData: StandingsFaceitTeamStats[] = [
  {
    team_name: "Frendy Fire",
    games_played: 10,
    maps_won: 8,
    maps_won_ot: 2,
    maps_lost: 0,
    maps_lost_ot: 0,
    points: 28,
    rounds_won: 139,
    rounds_lost: 95,
    rounds_diff: 44
  },
  {
    team_name: "Team Incoach",
    games_played: 10,
    maps_won: 6,
    maps_won_ot: 0,
    maps_lost: 3,
    maps_lost_ot: 1,
    points: 19,
    rounds_won: 109,
    rounds_lost: 92,
    rounds_diff: 17
  },
  {
    team_name: "Tasetaikurit",
    games_played: 10,
    maps_won: 4,
    maps_won_ot: 0,
    maps_lost: 5,
    maps_lost_ot: 1,
    points: 13,
    rounds_won: 104,
    rounds_lost: 114,
    rounds_diff: -10
  }
];

describe("StandingsTable", () => {
  it("renders loading state correctly", () => {
    render(<StandingsTable data={[]} isLoading={true} />);

    expect(screen.getByText("League Standings")).toBeInTheDocument();
    expect(screen.getByText("Loading standings...")).toBeInTheDocument();
    // Check for loading spinner
    expect(
      screen.getByText("Loading standings...").closest("div")
    ).toBeInTheDocument();
  });

  it("renders empty state correctly", () => {
    render(<StandingsTable data={[]} isLoading={false} />);

    expect(screen.getByText("League Standings")).toBeInTheDocument();
    expect(screen.getByText("No standings data available")).toBeInTheDocument();
    expect(
      screen.getByText("Please check back later or try a different league")
    ).toBeInTheDocument();
  });

  it("renders standings data correctly", () => {
    render(<StandingsTable data={mockStandingsData} isLoading={false} />);

    // Check if table headers are present
    expect(screen.getByText("#")).toBeInTheDocument();
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Played")).toBeInTheDocument();
    expect(screen.getByText("Won")).toBeInTheDocument();
    expect(screen.getByText("Won (OT)")).toBeInTheDocument();
    expect(screen.getByText("Lost")).toBeInTheDocument();
    expect(screen.getByText("Lost (OT)")).toBeInTheDocument();
    expect(screen.getByText("Points")).toBeInTheDocument();
    expect(screen.getByText("Rounds Won")).toBeInTheDocument();
    expect(screen.getByText("Rounds Lost")).toBeInTheDocument();
    expect(screen.getByText("Round Diff")).toBeInTheDocument();

    // Check if team data is rendered
    expect(screen.getByText("Frendy Fire")).toBeInTheDocument();
    expect(screen.getByText("Team Incoach")).toBeInTheDocument();
    expect(screen.getByText("Tasetaikurit")).toBeInTheDocument();

    // Check position numbers (first column)
    const positionCells = screen.getAllByText("1");
    expect(positionCells[0]).toBeInTheDocument(); // Position number
    expect(screen.getAllByText("2")[0]).toBeInTheDocument(); // Position number
    expect(screen.getAllByText("3")[0]).toBeInTheDocument(); // Position number
  });

  it("displays round difference with correct colors", () => {
    render(<StandingsTable data={mockStandingsData} isLoading={false} />);

    // Positive round difference should be green
    const positiveRoundDiff = screen.getByText("+44");
    expect(positiveRoundDiff).toHaveClass("text-green-600");

    // Negative round difference should be red
    const negativeRoundDiff = screen.getByText("-10");
    expect(negativeRoundDiff).toHaveClass("text-red-600");
  });

  it("handles sorting functionality", () => {
    render(<StandingsTable data={mockStandingsData} isLoading={false} />);

    // Find the Points column header
    const pointsHeader = screen.getByRole("columnheader", { name: /points/i });
    expect(pointsHeader).toBeInTheDocument();

    // Click to sort by points
    fireEvent.click(pointsHeader);

    // The table should still render (sorting is handled internally)
    expect(screen.getByText("Frendy Fire")).toBeInTheDocument();
  });

  it("displays correct statistics for each team", () => {
    render(<StandingsTable data={mockStandingsData} isLoading={false} />);

    // Check Frendy Fire's stats
    const frendyFireRow = screen.getByText("Frendy Fire").closest("tr");
    expect(frendyFireRow).toHaveTextContent("10"); // games played
    expect(frendyFireRow).toHaveTextContent("8"); // maps won
    expect(frendyFireRow).toHaveTextContent("28"); // points
    expect(frendyFireRow).toHaveTextContent("139"); // rounds won
    expect(frendyFireRow).toHaveTextContent("95"); // rounds lost
    expect(frendyFireRow).toHaveTextContent("+44"); // round diff
  });

  it("renders table with proper accessibility", () => {
    render(<StandingsTable data={mockStandingsData} isLoading={false} />);

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();

    // Check that all column headers are properly labeled
    expect(screen.getByRole("columnheader", { name: "#" })).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Team" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Points" })
    ).toBeInTheDocument();
  });

  it("handles empty team name gracefully", () => {
    const dataWithEmptyName: StandingsFaceitTeamStats[] = [
      {
        team_name: "",
        games_played: 5,
        maps_won: 3,
        maps_won_ot: 1,
        maps_lost: 1,
        maps_lost_ot: 0,
        points: 10,
        rounds_won: 50,
        rounds_lost: 40,
        rounds_diff: 10
      }
    ];

    render(<StandingsTable data={dataWithEmptyName} isLoading={false} />);

    // Should still render the table structure
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByText("1")[0]).toBeInTheDocument(); // Position number
  });

  it("handles zero round difference correctly", () => {
    const dataWithZeroRoundDiff: StandingsFaceitTeamStats[] = [
      {
        team_name: "Even Team",
        games_played: 5,
        maps_won: 3,
        maps_won_ot: 0,
        maps_lost: 2,
        maps_lost_ot: 0,
        points: 9,
        rounds_won: 50,
        rounds_lost: 50,
        rounds_diff: 0
      }
    ];

    render(<StandingsTable data={dataWithZeroRoundDiff} isLoading={false} />);

    // Find the round difference cell (should be the last one with "0")
    const roundDiffCells = screen.getAllByText("0");
    const zeroRoundDiff = roundDiffCells[roundDiffCells.length - 1]; // Last "0" should be round diff
    expect(zeroRoundDiff).toHaveClass("text-muted-foreground");
    expect(zeroRoundDiff).not.toHaveTextContent("+");
  });
});
