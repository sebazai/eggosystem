import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LeagueSelector } from "@/components/standings/LeagueSelector";
import { LEAGUES } from "@/types/standings";

describe("LeagueSelector", () => {
  const mockOnLeagueChange = jest.fn();

  beforeEach(() => {
    mockOnLeagueChange.mockClear();
  });

  it("renders with default selected league", () => {
    const selectedLeague = "fe4cb0c3-9934-484c-84d1-662acdb025d4"; // Masters A

    render(
      <LeagueSelector
        selectedLeague={selectedLeague}
        onLeagueChange={mockOnLeagueChange}
      />
    );

    // Should show the selected league name
    expect(screen.getByText("Masters A")).toBeInTheDocument();
  });

  it("renders all league options when opened", () => {
    const selectedLeague = "fe4cb0c3-9934-484c-84d1-662acdb025d4";

    render(
      <LeagueSelector
        selectedLeague={selectedLeague}
        onLeagueChange={mockOnLeagueChange}
      />
    );

    // Click to open the select
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    // Should show all league options
    LEAGUES.forEach((league) => {
      expect(screen.getAllByText(league.name).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("calls onLeagueChange when a different league is selected", () => {
    const selectedLeague = "fe4cb0c3-9934-484c-84d1-662acdb025d4"; // Masters A

    render(
      <LeagueSelector
        selectedLeague={selectedLeague}
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

    // Should call onLeagueChange with Masters B ID
    expect(mockOnLeagueChange).toHaveBeenCalledWith(
      "7752ba66-1554-4d11-8e31-1968f52865d4"
    );
  });

  it("handles selection behavior correctly", () => {
    const selectedLeague = "fe4cb0c3-9934-484c-84d1-662acdb025d4"; // Masters A

    render(
      <LeagueSelector
        selectedLeague={selectedLeague}
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

  it("displays correct league name for each league ID", () => {
    LEAGUES.forEach((league) => {
      const { unmount } = render(
        <LeagueSelector
          selectedLeague={league.id}
          onLeagueChange={mockOnLeagueChange}
        />
      );

      expect(screen.getByText(league.name)).toBeInTheDocument();

      // Clean up for next iteration
      unmount();
    });
  });

  it("handles unknown league ID gracefully", () => {
    const unknownLeagueId = "unknown-league-id";

    render(
      <LeagueSelector
        selectedLeague={unknownLeagueId}
        onLeagueChange={mockOnLeagueChange}
      />
    );

    // Should still render the component (with unknown league selected)
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    const selectedLeague = "fe4cb0c3-9934-484c-84d1-662acdb025d4";

    render(
      <LeagueSelector
        selectedLeague={selectedLeague}
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
        selectedLeague="fe4cb0c3-9934-484c-84d1-662acdb025d4" // Masters A
        onLeagueChange={mockOnLeagueChange}
      />
    );

    expect(screen.getByText("Masters A")).toBeInTheDocument();

    // Change the selected league
    rerender(
      <LeagueSelector
        selectedLeague="7752ba66-1554-4d11-8e31-1968f52865d4" // Masters B
        onLeagueChange={mockOnLeagueChange}
      />
    );

    expect(screen.getByText("Masters B")).toBeInTheDocument();
    expect(screen.queryByText("Masters A")).not.toBeInTheDocument();
  });

  it("maintains selection state correctly", () => {
    const selectedLeague = "fe4cb0c3-9934-484c-84d1-662acdb025d4"; // Masters A

    render(
      <LeagueSelector
        selectedLeague={selectedLeague}
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
});
