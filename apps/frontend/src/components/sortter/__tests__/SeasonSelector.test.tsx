import { render, screen, fireEvent } from "@testing-library/react";
import { SeasonSelector } from "../SeasonSelector";

describe("SeasonSelector", () => {
  const mockSeasons = [
    { id: 1, name: "Season 1" },
    { id: 2, name: "Season 2" },
    { id: 3, name: "Season 3" }
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with the selected season", () => {
    render(
      <SeasonSelector
        seasons={mockSeasons}
        selectedSeason={2}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText("Season 2")).toBeInTheDocument();
  });

  it("calls onChange when a new season is selected", () => {
    render(
      <SeasonSelector
        seasons={mockSeasons}
        selectedSeason={2}
        onChange={mockOnChange}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByRole("combobox"));

    // Select first season
    fireEvent.click(screen.getByText("Season 1"));

    expect(mockOnChange).toHaveBeenCalledWith(1);
  });

  it("displays loading state when isLoading is true", () => {
    render(
      <SeasonSelector
        seasons={[]}
        selectedSeason={null}
        onChange={mockOnChange}
        isLoading={true}
      />
    );

    expect(screen.getByText("Loading seasons...")).toBeInTheDocument();
  });
});
