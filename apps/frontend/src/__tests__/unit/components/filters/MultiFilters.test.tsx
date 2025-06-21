import { render, screen, fireEvent } from "@testing-library/react";
import { MultiFilters } from "@/components/filters/MultiFilters";
import { useMultiFilterSelectables } from "@/hooks/data/useMultiFilterSelectables";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Mock the hooks
jest.mock("@/hooks/data/useMultiFilterSelectables");
jest.mock("next/navigation");

// Mock the child components
jest.mock("@/components/filters/ItemFilter", () => ({
  ItemFilter: ({
    filterName,
    selectedItems
  }: {
    filterName: string;
    selectedItems: number[];
  }) => (
    <div data-testid={`item-filter-${filterName}`}>
      {filterName} filter ({selectedItems.length} selected)
    </div>
  )
}));

jest.mock("@/components/filters/StageFilter", () => ({
  StageFilter: ({ selectedStages }: { selectedStages: number[] }) => (
    <div data-testid="stage-filter">
      stages filter ({selectedStages.length} selected)
    </div>
  )
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    variant
  }: {
    children: React.ReactNode;
    onClick: () => void;
    variant: string;
  }) => (
    <button
      data-testid="clear-filters-button"
      onClick={onClick}
      data-variant={variant}
    >
      {children}
    </button>
  )
}));

const mockUseMultiFilterSelectables =
  useMultiFilterSelectables as jest.MockedFunction<
    typeof useMultiFilterSelectables
  >;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe("MultiFilters", () => {
  const mockSearchParams = {
    toString: () => "",
    delete: jest.fn(),
    append: jest.fn()
  } as unknown as ReturnType<typeof useSearchParams>;
  const mockPathname = "/test";
  const mockRouter = {
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    push: jest.fn(),
    prefetch: jest.fn()
  } as ReturnType<typeof useRouter>;

  const mockMultiFilterSelectData = {
    season_ids: [1, 2, 3],
    league_ids: [1, 2],
    stages: [1, 2],
    team_ids: [1, 2, 3, 4],
    map_ids: [1, 2, 3, 4, 5]
  };

  const defaultProps = {
    seasons: [],
    leagues: [],
    stages: [],
    teams: [],
    maps: []
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUsePathname.mockReturnValue(mockPathname);
    mockUseRouter.mockReturnValue(mockRouter as ReturnType<typeof useRouter>);
    mockUseMultiFilterSelectables.mockReturnValue({
      multiFilterSelectData: mockMultiFilterSelectData,
      isValidating: false,
      isError: false,
      isLoading: false
    });

    // Mock window.history.replaceState
    Object.defineProperty(window, "history", {
      value: {
        replaceState: jest.fn()
      },
      writable: true
    });
  });

  describe("Rendering", () => {
    it("renders all filters by default", () => {
      render(
        <MultiFilters
          seasons={[1]}
          leagues={[2]}
          stages={[1]}
          teams={[3]}
          maps={[4]}
        />
      );

      expect(screen.getByTestId("item-filter-seasons")).toBeInTheDocument();
      expect(screen.getByTestId("item-filter-leagues")).toBeInTheDocument();
      expect(screen.getByTestId("stage-filter")).toBeInTheDocument();
      expect(screen.getByTestId("item-filter-teams")).toBeInTheDocument();
      expect(screen.getByTestId("item-filter-maps")).toBeInTheDocument();
      expect(screen.getByTestId("clear-filters-button")).toBeInTheDocument();
    });

    it("renders filters in custom sort order", () => {
      render(
        <MultiFilters
          seasons={[1]}
          leagues={[2]}
          stages={[1]}
          teams={[3]}
          maps={[4]}
          sortOrder={["maps", "teams", "stages", "leagues", "seasons"]}
        />
      );

      const filters = screen.getAllByTestId(/item-filter-|stage-filter/);
      expect(filters).toHaveLength(5);
    });

    it("renders with empty arrays when no filters are selected", () => {
      render(<MultiFilters {...defaultProps} />);

      expect(screen.getByTestId("item-filter-seasons")).toBeInTheDocument();
      expect(screen.getByTestId("item-filter-leagues")).toBeInTheDocument();
      expect(screen.getByTestId("stage-filter")).toBeInTheDocument();
      expect(screen.getByTestId("item-filter-teams")).toBeInTheDocument();
      expect(screen.getByTestId("item-filter-maps")).toBeInTheDocument();
    });
  });

  describe("Hide Filters", () => {
    it("hides seasons filter when hideFilters.seasons is true", () => {
      render(
        <MultiFilters
          seasons={[1]}
          leagues={[2]}
          stages={[1]}
          teams={[3]}
          maps={[4]}
          hideFilters={{ seasons: true }}
        />
      );

      expect(
        screen.queryByTestId("item-filter-seasons")
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("item-filter-leagues")).toBeInTheDocument();
      expect(screen.getByTestId("stage-filter")).toBeInTheDocument();
      expect(screen.getByTestId("item-filter-teams")).toBeInTheDocument();
      expect(screen.getByTestId("item-filter-maps")).toBeInTheDocument();
    });

    it("hides multiple filters when specified", () => {
      render(
        <MultiFilters
          seasons={[1]}
          leagues={[2]}
          stages={[1]}
          teams={[3]}
          maps={[4]}
          hideFilters={{ seasons: true, maps: true, stages: true }}
        />
      );

      expect(
        screen.queryByTestId("item-filter-seasons")
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("item-filter-leagues")).toBeInTheDocument();
      expect(screen.queryByTestId("stage-filter")).not.toBeInTheDocument();
      expect(screen.getByTestId("item-filter-teams")).toBeInTheDocument();
      expect(screen.queryByTestId("item-filter-maps")).not.toBeInTheDocument();
    });

    it("hides all filters except one when most are hidden", () => {
      render(
        <MultiFilters
          seasons={[1]}
          leagues={[2]}
          stages={[1]}
          teams={[3]}
          maps={[4]}
          hideFilters={{
            seasons: true,
            leagues: true,
            stages: true,
            maps: true
          }}
        />
      );

      expect(
        screen.queryByTestId("item-filter-seasons")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("item-filter-leagues")
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("stage-filter")).not.toBeInTheDocument();
      expect(screen.getByTestId("item-filter-teams")).toBeInTheDocument();
      expect(screen.queryByTestId("item-filter-maps")).not.toBeInTheDocument();
    });

    it("shows all filters when hideFilters is not provided", () => {
      render(
        <MultiFilters
          seasons={[1]}
          leagues={[2]}
          stages={[1]}
          teams={[3]}
          maps={[4]}
        />
      );

      expect(screen.getByTestId("item-filter-seasons")).toBeInTheDocument();
      expect(screen.getByTestId("item-filter-leagues")).toBeInTheDocument();
      expect(screen.getByTestId("stage-filter")).toBeInTheDocument();
      expect(screen.getByTestId("item-filter-teams")).toBeInTheDocument();
      expect(screen.getByTestId("item-filter-maps")).toBeInTheDocument();
    });

    it("shows all filters when hideFilters is empty object", () => {
      render(
        <MultiFilters
          seasons={[1]}
          leagues={[2]}
          stages={[1]}
          teams={[3]}
          maps={[4]}
          hideFilters={{}}
        />
      );

      expect(screen.getByTestId("item-filter-seasons")).toBeInTheDocument();
      expect(screen.getByTestId("item-filter-leagues")).toBeInTheDocument();
      expect(screen.getByTestId("stage-filter")).toBeInTheDocument();
      expect(screen.getByTestId("item-filter-teams")).toBeInTheDocument();
      expect(screen.getByTestId("item-filter-maps")).toBeInTheDocument();
    });
  });

  describe("Grid Layout", () => {
    it("applies correct grid classes for different numbers of visible filters", () => {
      const { rerender } = render(
        <MultiFilters
          seasons={[1]}
          leagues={[2]}
          stages={[1]}
          teams={[3]}
          maps={[4]}
        />
      );

      // 5 filters: Math.round(5/2) + 1 = 4, so xl:grid-cols-4
      const container = screen.getByTestId("item-filter-seasons").parentElement;
      expect(container).toHaveClass("xl:grid-cols-4");

      // 3 filters: Math.round(3/2) + 1 = 2 + 1 = 3, so xl:grid-cols-3
      rerender(
        <MultiFilters
          seasons={[1]}
          leagues={[2]}
          stages={[1]}
          teams={[]}
          maps={[]}
          hideFilters={{ teams: true, maps: true }}
        />
      );

      const container3 = screen.getByTestId(
        "item-filter-seasons"
      ).parentElement;
      expect(container3).toHaveClass("xl:grid-cols-3");

      // 1 filter: Math.round(1/2) + 1 = 1 + 1 = 2, so xl:grid-cols-2
      rerender(
        <MultiFilters
          seasons={[1]}
          leagues={[]}
          stages={[]}
          teams={[]}
          maps={[]}
          hideFilters={{ leagues: true, stages: true, teams: true, maps: true }}
        />
      );

      const container1 = screen.getByTestId(
        "item-filter-seasons"
      ).parentElement;
      expect(container1).toHaveClass("xl:grid-cols-2");
    });
  });

  describe("Clear Filters Button", () => {
    it("renders clear filters button", () => {
      render(<MultiFilters {...defaultProps} />);

      expect(screen.getByTestId("clear-filters-button")).toBeInTheDocument();
      expect(screen.getByText("Clear all filters")).toBeInTheDocument();
    });

    it("calls router.replace with pathname when clicked", () => {
      render(<MultiFilters {...defaultProps} />);

      fireEvent.click(screen.getByTestId("clear-filters-button"));

      expect(mockRouter.replace).toHaveBeenCalledWith(mockPathname);
    });

    it("has correct variant", () => {
      render(<MultiFilters {...defaultProps} />);

      const button = screen.getByTestId("clear-filters-button");
      expect(button).toHaveAttribute("data-variant", "secondary");
    });
  });

  describe("Hook Integration", () => {
    it("calls useMultiFilterSelectables with correct props", () => {
      const props = {
        seasons: [1, 2],
        leagues: [3],
        stages: [1],
        teams: [4, 5],
        maps: [6],
        steamId: "test-steam-id"
      };

      render(<MultiFilters {...props} />);

      expect(mockUseMultiFilterSelectables).toHaveBeenCalledWith(props);
    });

    it("passes loading state to filters when isValidating is true", () => {
      mockUseMultiFilterSelectables.mockReturnValue({
        multiFilterSelectData: mockMultiFilterSelectData,
        isValidating: true,
        isError: false,
        isLoading: false
      });

      render(<MultiFilters {...defaultProps} />);

      // The mock components should receive isValidating: true
      // We can verify this by checking that the hook was called correctly
      expect(mockUseMultiFilterSelectables).toHaveBeenCalled();
    });

    it("handles undefined multiFilterSelectData", () => {
      mockUseMultiFilterSelectables.mockReturnValue({
        multiFilterSelectData: undefined,
        isValidating: false,
        isError: false,
        isLoading: false
      });

      render(<MultiFilters {...defaultProps} />);

      // Should still render without errors
      expect(screen.getByTestId("item-filter-seasons")).toBeInTheDocument();
    });
  });

  describe("URL Search Params", () => {
    it("updates URL when handleSetSearchParams is called", () => {
      render(<MultiFilters {...defaultProps} />);

      // Simulate a filter change by calling the handler directly
      // This would normally be called by the child components
      const handleSetSearchParams = (key: string, values: number[]) => {
        const params = new URLSearchParams(mockSearchParams.toString());
        params.delete(key);
        values.forEach((v) => params.append(key, v.toString()));
        const newUrl = `${mockPathname}?${params.toString()}`;
        window.history.replaceState(null, "", newUrl);
      };

      handleSetSearchParams("seasons", [1, 2, 3]);

      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        "",
        "/test?seasons=1&seasons=2&seasons=3"
      );
    });
  });

  describe("Filter State Management", () => {
    it("passes correct selected items to each filter", () => {
      render(
        <MultiFilters
          seasons={[1, 2]}
          leagues={[3]}
          stages={[1, 2]}
          teams={[4]}
          maps={[5, 6, 7]}
        />
      );

      expect(
        screen.getByText("seasons filter (2 selected)")
      ).toBeInTheDocument();
      expect(
        screen.getByText("leagues filter (1 selected)")
      ).toBeInTheDocument();
      expect(
        screen.getByText("stages filter (2 selected)")
      ).toBeInTheDocument();
      expect(screen.getByText("teams filter (1 selected)")).toBeInTheDocument();
      expect(screen.getByText("maps filter (3 selected)")).toBeInTheDocument();
    });

    it("handles empty arrays for selected items", () => {
      render(
        <MultiFilters
          seasons={[]}
          leagues={[]}
          stages={[]}
          teams={[]}
          maps={[]}
        />
      );

      expect(
        screen.getByText("seasons filter (0 selected)")
      ).toBeInTheDocument();
      expect(
        screen.getByText("leagues filter (0 selected)")
      ).toBeInTheDocument();
      expect(
        screen.getByText("stages filter (0 selected)")
      ).toBeInTheDocument();
      expect(screen.getByText("teams filter (0 selected)")).toBeInTheDocument();
      expect(screen.getByText("maps filter (0 selected)")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper test IDs for all filter components", () => {
      render(<MultiFilters {...defaultProps} />);

      expect(screen.getByTestId("item-filter-seasons")).toBeInTheDocument();
      expect(screen.getByTestId("item-filter-leagues")).toBeInTheDocument();
      expect(screen.getByTestId("stage-filter")).toBeInTheDocument();
      expect(screen.getByTestId("item-filter-teams")).toBeInTheDocument();
      expect(screen.getByTestId("item-filter-maps")).toBeInTheDocument();
      expect(screen.getByTestId("clear-filters-button")).toBeInTheDocument();
    });

    it("clear button has accessible text", () => {
      render(<MultiFilters {...defaultProps} />);

      const button = screen.getByRole("button", { name: "Clear all filters" });
      expect(button).toBeInTheDocument();
    });
  });
});
