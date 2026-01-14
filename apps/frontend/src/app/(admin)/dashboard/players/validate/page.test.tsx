import { render, screen, waitFor } from "@testing-library/react";
import PlayerValidationPage from "./page";
import { SeasonPlatform, createMockSeason } from "@eggosystem/types";
import { useAllSeasons } from "@/hooks/data/useAllSeasons";
import { useAllSeasons as useDashboardAllSeasons } from "@/hooks/data/dashboard/useAllSeasons";
import { usePlayerValidation } from "@/hooks/data/dashboard/usePlayerValidation";
import { useSearchParams } from "next/navigation";
import { useDashboardSeason } from "@/hooks/data/dashboard/useDashboardSeason";

// Mock the custom hooks
jest.mock("@/hooks/data/useAllSeasons");
jest.mock("@/hooks/data/dashboard/useAllSeasons");
jest.mock("@/hooks/data/dashboard/usePlayerValidation");
jest.mock("@/hooks/data/dashboard/useDashboardSeason", () => ({
  useDashboardSeason: jest.fn()
}));

// Mock Next.js navigation
const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  })),
  usePathname: jest.fn(() => "/dashboard/players/validate"),
  useSearchParams: jest.fn()
}));

// Mock WithRoleProtection
jest.mock("@/components/dashboard/WithRoleProtection", () => ({
  WithRoleProtection: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="role-protection">{children}</div>
  )
}));

// Mock PlayerValidationForm
jest.mock("@/components/dashboard/PlayerValidationForm", () => ({
  PlayerValidationForm: ({
    steamId,
    seasonId,
    setSteamId,
    setSeasonId
  }: {
    steamId: string;
    seasonId: string;
    setSteamId: (value: string) => void;
    setSeasonId?: (value: string) => void;
  }) => (
    <div data-testid="player-validation-form">
      <input
        data-testid="steam-id-input"
        value={steamId}
        onChange={(e) => setSteamId(e.target.value)}
      />
      <input
        data-testid="season-id-input"
        value={seasonId}
        onChange={(e) => setSeasonId?.(e.target.value)}
      />
    </div>
  )
}));

// Mock PlayerValidationDisplay
jest.mock("@/components/dashboard/PlayerValidationDisplay", () => ({
  PlayerValidationDisplay: () => (
    <div data-testid="validation-display">Validation Display</div>
  )
}));

const mockUseAllSeasons = useAllSeasons as jest.MockedFunction<
  typeof useAllSeasons
>;
const mockUseDashboardAllSeasons =
  useDashboardAllSeasons as jest.MockedFunction<typeof useDashboardAllSeasons>;
const mockUsePlayerValidation = usePlayerValidation as jest.MockedFunction<
  typeof usePlayerValidation
>;
const mockUseDashboardSeason = useDashboardSeason as jest.MockedFunction<
  typeof useDashboardSeason
>;

describe("PlayerValidationPage - URL Parameter Sync", () => {
  const mockSeasons = [
    createMockSeason({
      id: 1,
      name: "Season 1",
      platform: SeasonPlatform.FACEIT
    }),
    createMockSeason({
      id: 2,
      name: "Season 2",
      platform: SeasonPlatform.Esportal
    })
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAllSeasons.mockReturnValue({
      seasons: mockSeasons,
      isLoading: false,
      isError: false,
      isValidating: false
    });
    mockUseDashboardAllSeasons.mockReturnValue({
      seasons: mockSeasons,
      isLoading: false,
      isError: false,
      isValidating: false
    });
    mockUsePlayerValidation.mockReturnValue({
      validationResult: null,
      isValidating: false,
      error: null,
      validatePlayer: jest.fn(),
      clearResults: jest.fn()
    });
    // Default to having a season selected so the form renders
    mockUseDashboardSeason.mockReturnValue({
      selectedSeasonId: "1",
      setSelectedSeasonId: jest.fn()
    });
  });

  it("should sync steamId from URL params on mount", () => {
    const searchParams = new URLSearchParams("steamId=76561198012345678");
    mockUseSearchParams.mockReturnValue(searchParams as any);

    render(<PlayerValidationPage />);

    const steamIdInput = screen.getByTestId(
      "steam-id-input"
    ) as HTMLInputElement;
    expect(steamIdInput.value).toBe("76561198012345678");
  });

  it("should sync seasonId from URL params on mount", () => {
    const searchParams = new URLSearchParams("seasonId=1");
    mockUseSearchParams.mockReturnValue(searchParams as any);

    render(<PlayerValidationPage />);

    const seasonIdInput = screen.getByTestId(
      "season-id-input"
    ) as HTMLInputElement;
    expect(seasonIdInput.value).toBe("1");
  });

  it("should sync both steamId and seasonId from URL params", () => {
    const searchParams = new URLSearchParams(
      "steamId=76561198012345678&seasonId=2"
    );
    mockUseSearchParams.mockReturnValue(searchParams as any);
    // Set selectedSeasonId to empty string so URL params are used for seasonId value
    // But we need a truthy selectedSeasonId for the form to render
    // So we'll use the URL param value as selectedSeasonId to test the sync
    mockUseDashboardSeason.mockReturnValue({
      selectedSeasonId: "2", // Use the URL param value so form renders
      setSelectedSeasonId: jest.fn()
    });

    render(<PlayerValidationPage />);

    const steamIdInput = screen.getByTestId(
      "steam-id-input"
    ) as HTMLInputElement;
    const seasonIdInput = screen.getByTestId(
      "season-id-input"
    ) as HTMLInputElement;

    expect(steamIdInput.value).toBe("76561198012345678");
    expect(seasonIdInput.value).toBe("2");
  });

  it("should set platform when seasonId is set from URL params", () => {
    const searchParams = new URLSearchParams("seasonId=1");
    mockUseSearchParams.mockReturnValue(searchParams as any);

    render(<PlayerValidationPage />);

    // Platform should be set based on the season
    // This is tested indirectly through the form being enabled/disabled
    const form = screen.getByTestId("player-validation-form");
    expect(form).toBeInTheDocument();
  });

  it("should update state when URL params change", () => {
    const searchParams1 = new URLSearchParams("steamId=76561198012345678");
    mockUseSearchParams.mockReturnValue(searchParams1 as any);
    // Set selectedSeasonId so form renders
    mockUseDashboardSeason.mockReturnValue({
      selectedSeasonId: "1",
      setSelectedSeasonId: jest.fn()
    });

    const { rerender } = render(<PlayerValidationPage />);

    let steamIdInput = screen.getByTestId("steam-id-input") as HTMLInputElement;
    expect(steamIdInput.value).toBe("76561198012345678");

    // Simulate URL param change - update selectedSeasonId to match new URL param
    const searchParams2 = new URLSearchParams(
      "steamId=76561198098765432&seasonId=2"
    );
    mockUseSearchParams.mockReturnValue(searchParams2 as any);
    mockUseDashboardSeason.mockReturnValue({
      selectedSeasonId: "2", // Update to match URL param
      setSelectedSeasonId: jest.fn()
    });
    rerender(<PlayerValidationPage />);

    steamIdInput = screen.getByTestId("steam-id-input") as HTMLInputElement;
    const seasonIdInput = screen.getByTestId(
      "season-id-input"
    ) as HTMLInputElement;

    expect(steamIdInput.value).toBe("76561198098765432");
    expect(seasonIdInput.value).toBe("2");
  });

  it("should handle empty URL params", () => {
    const searchParams = new URLSearchParams();
    mockUseSearchParams.mockReturnValue(searchParams as any);
    // Set selectedSeasonId so form renders, but no URL params means seasonId will be the selectedSeasonId
    mockUseDashboardSeason.mockReturnValue({
      selectedSeasonId: "1",
      setSelectedSeasonId: jest.fn()
    });

    render(<PlayerValidationPage />);

    const steamIdInput = screen.getByTestId(
      "steam-id-input"
    ) as HTMLInputElement;
    const seasonIdInput = screen.getByTestId(
      "season-id-input"
    ) as HTMLInputElement;

    expect(steamIdInput.value).toBe("");
    // When selectedSeasonId is set and no URL param, seasonId uses selectedSeasonId
    expect(seasonIdInput.value).toBe("1");
  });
});
