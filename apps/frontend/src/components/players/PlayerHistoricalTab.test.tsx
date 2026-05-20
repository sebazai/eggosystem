import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlayerHistoricalTab } from "./PlayerHistoricalTab";

const mockUsePlayerActiveSeasons = jest.fn();
const mockUsePlayerHistoricalData = jest.fn();
const mockUsePlayerHistoricalAverage = jest.fn();
const mockUsePlayerHistoricalAverageByRank = jest.fn();
const mockUsePlayerHistoricalAverageByLevel = jest.fn();

jest.mock("@/hooks/data/usePlayerHistoricalData", () => ({
  usePlayerActiveSeasons: (...args: unknown[]) =>
    mockUsePlayerActiveSeasons(...args),
  usePlayerHistoricalData: (...args: unknown[]) =>
    mockUsePlayerHistoricalData(...args),
  usePlayerHistoricalAverage: (...args: unknown[]) =>
    mockUsePlayerHistoricalAverage(...args),
  usePlayerHistoricalAverageByRank: (...args: unknown[]) =>
    mockUsePlayerHistoricalAverageByRank(...args),
  usePlayerHistoricalAverageByLevel: (...args: unknown[]) =>
    mockUsePlayerHistoricalAverageByLevel(...args),
  parsePeriodToParams: (period: string) =>
    period.startsWith("last_")
      ? { games: parseInt(period.replace("last_", ""), 10) }
      : {}
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() })
}));

jest.mock("@/context/FilterContext", () => ({
  useFilters: () => ({ filterParams: {} })
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    value,
    onValueChange
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange: (value: string) => void;
  }) => (
    <div
      data-testid={
        [
          "last_5",
          "last_10",
          "last_15",
          "last_20",
          "last_30",
          "last_50",
          "this_season",
          "last_season",
          "all_seasons"
        ].includes(value)
          ? "period-select"
          : "compare-select"
      }
      data-value={value}
    >
      <button type="button" onClick={() => onValueChange("this_season")}>
        Select this season
      </button>
      {children}
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({
    value,
    children
  }: {
    value: string;
    children: React.ReactNode;
  }) => <div data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectValue: () => <span />
}));

jest.mock("@/components/ui/chart", () => ({
  ChartContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  ChartTooltip: () => null,
  ChartTooltipContent: () => null
}));

jest.mock("recharts", () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  ReferenceLine: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  )
}));

jest.mock("@/components/loading", () => ({
  CardSkeleton: () => <div data-testid="card-skeleton" />
}));

describe("PlayerHistoricalTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePlayerActiveSeasons.mockReturnValue({
      data: {
        current_season: {
          season_id: 42,
          full_name: "Spring 2025",
          start_date: "2025-03-01",
          end_date: null
        },
        last_season: {
          season_id: 41,
          full_name: "Winter 2024",
          start_date: "2024-10-01",
          end_date: "2025-02-28"
        }
      },
      isLoading: false,
      error: undefined
    });

    mockUsePlayerHistoricalData.mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false
    });

    mockUsePlayerHistoricalAverage.mockReturnValue({
      data: undefined,
      isLoading: false
    });
    mockUsePlayerHistoricalAverageByRank.mockReturnValue({
      data: undefined,
      isLoading: false
    });
    mockUsePlayerHistoricalAverageByLevel.mockReturnValue({
      data: undefined,
      isLoading: false
    });
  });

  it("uses dynamic season_id when this_season period is selected", async () => {
    const user = userEvent.setup();
    render(<PlayerHistoricalTab steamId="76561198012345678" />);

    expect(mockUsePlayerHistoricalData).toHaveBeenCalledWith(
      "76561198012345678",
      { games: 15 }
    );

    await user.click(
      screen.getByTestId("period-select").querySelector("button")!
    );

    expect(mockUsePlayerHistoricalData).toHaveBeenLastCalledWith(
      "76561198012345678",
      { season_id: 42 }
    );
  });

  it("labels this season option from active seasons data", () => {
    render(<PlayerHistoricalTab steamId="76561198012345678" />);

    expect(screen.getByText("Spring 2025 (current)")).toBeInTheDocument();
  });
});
