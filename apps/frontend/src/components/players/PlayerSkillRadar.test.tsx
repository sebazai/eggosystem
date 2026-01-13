import { render, screen, waitFor } from "@testing-library/react";
import { PlayerSkillRadar } from "./PlayerSkillRadar";
import userEvent from "@testing-library/user-event";

// Mock child components
jest.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select">
      <button
        onClick={() => onValueChange("new-value")}
        data-testid="select-button"
      >
        Change
      </button>
      <div data-testid="select-value">{value}</div>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ value, children }: any) => (
    <div data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <div>Select value</div>
}));

// Mock UI components
jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  CardContent: ({ children }: any) => <div>{children}</div>
}));

jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton" />
}));

jest.mock("@/components/ui/alert", () => ({
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>
}));

// Mock recharts components
jest.mock("recharts", () => ({
  RadarChart: ({ children }: any) => (
    <div data-testid="radar-chart">{children}</div>
  ),
  Radar: () => <div data-testid="radar" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Tooltip: () => null,
  Legend: () => <div data-testid="legend" />
}));

describe("PlayerSkillRadar", () => {
  const mockPlayerSkillData = {
    steam_id: "76561198012345678",
    nickname: "TestPlayer",
    overall_rating: 60,
    aim: 50,
    impact: 55,
    positioning: 60,
    utility: 70,
    consistency: 65,
    detailed_metrics: {
      hs_percent: 0.5,
      kd: 1.0,
      adr: 80,
      ttd: 0.5,
      counter_strafing: 0.5,
      crosshair_placement: 0.5,
      accuracy: 0.5,
      first_kill_death_ratio: 1.0,
      first_death_trade_percentage: 0.5,
      trade_opportunities_converted: 0.5,
      first_death_trade_attempts_ratio: 0.5,
      first_death_traded_ratio: 0.5,
      good_deaths_percentage: 0.5,
      tradeable_first_deaths_percentage: 0.5,
      traded_deaths_success_percentage: 0.5,
      traded_death_attempts_percentage: 0.5,
      trade_kill_opportunities_per_round: 0.5,
      trade_kill_success_percentage: 0.5,
      trade_kill_attempts_percentage: 0.5,
      trade_death_opportunities_per_round: 0.5,
      t_opening_duel_success_percentage: 0.5,
      ct_opening_duel_success_percentage: 0.5,
      kast: 0.7,
      clutches_won_percentage: 0.5,
      multikills: 0.5,
      kana_rating: 50,
      one_v_one_win_ratio: 0.5,
      first_kills_per_round: 0.5,
      first_kill_success_ratio: 0.5,
      trades_per_round: 0.5,
      flash_assists: 0.5,
      enemies_flashed: 0.5,
      enemies_flashed_duration: 0.5,
      utility_damage: 0.5,
      he_damage_per_round: 0.5,
      molotov_damage_per_round: 0.5,
      teammates_flashed_inverse: 0.5,
      flash_assists_per_flash: 0.5,
      enemies_flashed_per_flash: 0.5,
      teammates_flashed_per_flash: 0.5,
      ct_t_balance: 0.5,
      map_consistency: 0.5,
      clutch_vs_entry_balance: 0.5,
      trade_death_ratio: 0.5,
      adr_t: 80,
      adr_ct: 80,
      kd_t: 1.0,
      kd_ct: 1.0,
      kills_variance: 0.5,
      deaths_variance: 0.5,
      adr_variance: 0.5,
      first_kill_death_ratio_t: 1.0,
      first_kill_death_ratio_ct: 1.0
    }
  };

  const defaultProps = {
    playerSkillData: mockPlayerSkillData,
    compareSkillData: undefined,
    isLoading: false,
    initialCompareOption: "all",
    onCompareOptionChange: jest.fn(),
    isCompareDataNotFound: false,
    playerTeam: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with initialCompareOption", () => {
    render(<PlayerSkillRadar {...defaultProps} initialCompareOption="team" />);

    const selectValue = screen.getByTestId("select-value");
    expect(selectValue).toHaveTextContent("team");
  });

  it("should sync compareOption when initialCompareOption changes", () => {
    const { rerender } = render(
      <PlayerSkillRadar {...defaultProps} initialCompareOption="all" />
    );

    let selectValue = screen.getByTestId("select-value");
    expect(selectValue).toHaveTextContent("all");

    // Change initialCompareOption
    rerender(
      <PlayerSkillRadar {...defaultProps} initialCompareOption="team" />
    );

    selectValue = screen.getByTestId("select-value");
    expect(selectValue).toHaveTextContent("team");
  });

  it("should not update if compareOption already matches initialCompareOption", () => {
    const { rerender } = render(
      <PlayerSkillRadar {...defaultProps} initialCompareOption="all" />
    );

    let selectValue = screen.getByTestId("select-value");
    expect(selectValue).toHaveTextContent("all");

    // Change to same value
    rerender(<PlayerSkillRadar {...defaultProps} initialCompareOption="all" />);

    selectValue = screen.getByTestId("select-value");
    expect(selectValue).toHaveTextContent("all");
  });

  it("should call onCompareOptionChange when user selects new option", async () => {
    const user = userEvent.setup();
    const onCompareOptionChange = jest.fn();

    render(
      <PlayerSkillRadar
        {...defaultProps}
        initialCompareOption="all"
        onCompareOptionChange={onCompareOptionChange}
      />
    );

    const selectButton = screen.getByTestId("select-button");
    await user.click(selectButton);

    await waitFor(() => {
      expect(onCompareOptionChange).toHaveBeenCalledWith("new-value");
    });
  });

  it("should handle different initialCompareOption values", () => {
    const { rerender } = render(
      <PlayerSkillRadar {...defaultProps} initialCompareOption="all" />
    );

    expect(screen.getByTestId("select-value")).toHaveTextContent("all");

    rerender(
      <PlayerSkillRadar {...defaultProps} initialCompareOption="team" />
    );
    expect(screen.getByTestId("select-value")).toHaveTextContent("team");

    rerender(
      <PlayerSkillRadar {...defaultProps} initialCompareOption="league" />
    );
    expect(screen.getByTestId("select-value")).toHaveTextContent("league");
  });
});
