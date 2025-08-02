import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LeagueSelector } from "@/components/standings/LeagueSelector";
import type { StandingsLeagues } from "@eggosystem/types";

// Mock leagues data that matches the StandingsLeagues interface
const LEAGUES: StandingsLeagues[] = [
  {
    id: 1,
    external_id: "fe4cb0c3-9934-484c-84d1-662acdb025d4",
    external_league_name: "Masters A",
    league_name: "Masters A",
    tier: 1,
    isBO2PlayedAs2xBO1: false,
    stage_id: 1,
    season_id: 1,
    league_id: 1,
    type: "roundRobin"
  },
  {
    id: 2,
    external_id: "7752ba66-1554-4d11-8e31-1968f52865d4",
    external_league_name: "Masters B",
    league_name: "Masters B",
    tier: 2,
    isBO2PlayedAs2xBO1: false,
    stage_id: 1,
    season_id: 1,
    league_id: 2,
    type: "roundRobin"
  },
  {
    id: 3,
    external_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    external_league_name: "Challengers A",
    league_name: "Challengers A",
    tier: 3,
    isBO2PlayedAs2xBO1: false,
    stage_id: 1,
    season_id: 1,
    league_id: 3,
    type: "roundRobin"
  }
];

describe("LeagueSelector", () => {
  const mockOnLeagueChange = jest.fn();

  beforeEach(() => {
    mockOnLeagueChange.mockClear();
  });

  it("renders with default selected league", () => {
    const selectedLeague = LEAGUES[0]!; // Masters A

    render(
      <LeagueSelector
        selectedLeague={selectedLeague}
        allLeagues={LEAGUES}
        onLeagueChange={mockOnLeagueChange}
      />
    );

    // Should show the selected league name
    expect(screen.getByText("Masters A")).toBeInTheDocument();
  });

  it("renders all league options when opened", () => {
    const selectedLeague = LEAGUES[0]!; // Masters A

    render(
      <LeagueSelector
        selectedLeague={selectedLeague}
        allLeagues={LEAGUES}
        onLeagueChange={mockOnLeagueChange}
      />
    );

    // Click to open the select
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    // Should show all league options
    LEAGUES.forEach((league) => {
      expect(
        screen.getAllByText(league.league_name).length
      ).toBeGreaterThanOrEqual(1);
    });
  });

  it("calls onLeagueChange when a different league is selected", () => {
    const selectedLeague = LEAGUES[0]!; // Masters A

    render(
      <LeagueSelector
        selectedLeague={selectedLeague}
        allLeagues={LEAGUES}
        onLeagueChange={mockOnLeagueChange}
      />
    );

    // Click to open the select
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    // Click on Masters B option (find the option in the dropdown)
    const mastersBOptions = screen.getAllByText("Masters B");
    const mastersBOption = mastersBOptions.find((el) =>
      el.closest('[role="option"]')
    );
    fireEvent.click(mastersBOption!);

    // Should call onLeagueChange with Masters B external_id
    expect(mockOnLeagueChange).toHaveBeenCalledWith(
      "7752ba66-1554-4d11-8e31-1968f52865d4"
    );
  });

  it("handles selection behavior correctly", () => {
    const selectedLeague = LEAGUES[0]!; // Masters A

    render(
      <LeagueSelector
        selectedLeague={selectedLeague}
        allLeagues={LEAGUES}
        onLeagueChange={mockOnLeagueChange}
      />
    );

    // Click to open the select
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    // The select should be open and show options
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    // Check that options are visible
    expect(screen.getAllByText("Masters A").length).toBeGreaterThanOrEqual(1);
  });

  it("displays correct league name for each league", () => {
    LEAGUES.forEach((league) => {
      const { unmount } = render(
        <LeagueSelector
          selectedLeague={league}
          allLeagues={LEAGUES}
          onLeagueChange={mockOnLeagueChange}
        />
      );

      expect(screen.getByText(league.league_name)).toBeInTheDocument();

      // Clean up for next iteration
      unmount();
    });
  });

  it("handles null selectedLeague gracefully", () => {
    render(
      <LeagueSelector
        selectedLeague={null}
        allLeagues={LEAGUES}
        onLeagueChange={mockOnLeagueChange}
      />
    );

    // Should not render anything when selectedLeague is null
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    const selectedLeague = LEAGUES[0]!; // Masters A

    render(
      <LeagueSelector
        selectedLeague={selectedLeague}
        allLeagues={LEAGUES}
        onLeagueChange={mockOnLeagueChange}
      />
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("updates display when selectedLeague prop changes", () => {
    const { rerender } = render(
      <LeagueSelector
        selectedLeague={LEAGUES[0]!} // Masters A
        allLeagues={LEAGUES}
        onLeagueChange={mockOnLeagueChange}
      />
    );

    expect(screen.getByText("Masters A")).toBeInTheDocument();

    // Change the selected league
    rerender(
      <LeagueSelector
        selectedLeague={LEAGUES[1]!} // Masters B
        allLeagues={LEAGUES}
        onLeagueChange={mockOnLeagueChange}
      />
    );

    expect(screen.getByText("Masters B")).toBeInTheDocument();
    expect(screen.queryByText("Masters A")).not.toBeInTheDocument();
  });

  it("maintains selection state correctly", () => {
    const selectedLeague = LEAGUES[0]!; // Masters A

    render(
      <LeagueSelector
        selectedLeague={selectedLeague}
        allLeagues={LEAGUES}
        onLeagueChange={mockOnLeagueChange}
      />
    );

    // Open and close the select without changing selection
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    // Press escape to close without selecting
    fireEvent.keyDown(trigger, { key: "Escape" });

    // Should still show the original selection
    expect(screen.getByText("Masters A")).toBeInTheDocument();
  });

  it("renders with empty allLeagues array", () => {
    const selectedLeague = LEAGUES[0]!; // Masters A

    render(
      <LeagueSelector
        selectedLeague={selectedLeague}
        allLeagues={[]}
        onLeagueChange={mockOnLeagueChange}
      />
    );

    // Should still render the component with selected league
    expect(screen.getByText("Masters A")).toBeInTheDocument();

    // Click to open the select
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    // Should not have any options since allLeagues is empty
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });
});
