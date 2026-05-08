import { render, screen } from "@testing-library/react";
import { SignupForm } from "@/components/signup/SignupForm";
import { useAuth } from "@/context/AuthContext";
import { useSeasonDetails } from "@/hooks/data/useSeasonDetails";
import { useCreateOrganizationForSignup } from "@/hooks/data/useCreateOrganizationForSignup";
import {
  AabeSteamId,
  createMockSeasonDetails,
  HoolyzSteamId,
  QuattraSteamId,
  SeasonPlatform,
  TrevSteamId,
  ValidWorkEmail1SteamId
} from "@eggosystem/types";
import type { SignupFormValues, SignupPlayerType } from "@eggosystem/types";

// Mock ResizeObserver for Radix UI compatibility
beforeAll(() => {
  global.ResizeObserver =
    global.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
});

// Mock Next.js Image / Link
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    width,
    height
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} />
  )
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>
}));

// Mock the API client
jest.mock("@/lib/apiClient", () => ({
  clientApiFetch: jest.fn().mockResolvedValue({}),
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      message: string
    ) {
      super(message);
      this.name = "ApiError";
    }
  }
}));

// Mock the data hooks (also referenced inside child Tab components)
jest.mock("@/context/AuthContext");
jest.mock("@/hooks/data/useSeasonDetails");
jest.mock("@/hooks/data/useCreateOrganizationForSignup");

// Stub out child tab components so we can drive the form via editValues without
// having to mock every nested data hook (organizations, teams, faceit lookup).
// The submit-gating logic under test (validPlayerSelection / canSubmit) lives in
// SignupForm itself, so the tabs do not need real implementations here.
jest.mock("@/components/signup/TabOrganization", () => ({
  TabOrganization: () => <div data-testid="stub-tab-organization" />
}));
jest.mock("@/components/signup/TabTeam", () => ({
  TabTeam: () => <div data-testid="stub-tab-team" />
}));
jest.mock("@/components/signup/TabPlayers", () => ({
  TabPlayers: () => <div data-testid="stub-tab-players" />
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseSeasonDetails = useSeasonDetails as jest.MockedFunction<
  typeof useSeasonDetails
>;
const mockUseCreateOrganizationForSignup =
  useCreateOrganizationForSignup as jest.MockedFunction<
    typeof useCreateOrganizationForSignup
  >;

const mockUser = {
  account_id: 123,
  steam_id: "76561198000000000",
  nickname: "TestCaptain",
  acceptedPrivacyPolicy: true,
  acceptedMarketing: false,
  acceptedNewsletter: true,
  isPersonalEmail: false,
  discordLinked: true,
  fullName: "Test Captain",
  workEmail: "captain@example.com",
  discord: "captain#0001",
  provider_id: "76561198000000000",
  provider: "steam" as const,
  roles: []
};

/**
 * Build a fully-valid signup payload (5 players, captain + co-captain set,
 * organization/team selected, terms accepted, FACEIT external team UUID
 * provided so validTeamSelection can succeed if external validation is
 * bypassed). Individual tests override player fields to flip flag-gated checks.
 */
const buildValidEditValues = (
  overrides?: (player: SignupPlayerType, index: number) => SignupPlayerType
): SignupFormValues => {
  const baseSteamIds = [
    AabeSteamId,
    HoolyzSteamId,
    QuattraSteamId,
    TrevSteamId,
    ValidWorkEmail1SteamId
  ];

  const players: SignupPlayerType[] = baseSteamIds.map((steamId, index) => {
    const base: SignupPlayerType = {
      accountId: 1000 + index,
      steamId,
      nickname: `Player${index}`,
      discord: `Player${index}#0001`,
      discordLinked: true,
      captain: index === 0,
      coCaptain: index === 1,
      hasValidData: true,
      hasValidWorkEmail: true,
      isEmailVerified: true,
      hours: 1500,
      rank: 15,
      externalRank: 10
    };
    return overrides ? overrides(base, index) : base;
  });

  return {
    organizationId: 1,
    teamId: 2,
    teamExternalId: "00000000-0000-0000-0000-000000000000",
    captainHasReadTermAndConditions: true,
    players
  };
};

describe("SignupForm submit-gating (S1-AC-1, S2-AC-2)", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      logout: jest.fn(),
      checkAuth: jest.fn()
    });

    mockUseCreateOrganizationForSignup.mockReturnValue({
      createOrganization: jest.fn().mockResolvedValue(null),
      isCreating: false
    });
  });

  it("disables submit when profile_link_required=true and a player has hours=-1", () => {
    mockUseSeasonDetails.mockReturnValue({
      seasonDetails: createMockSeasonDetails({
        platform: SeasonPlatform.Kanaliiga,
        profile_link_required: true,
        hours_played_required: false,
        faceit_rank_required: false,
        premier_rank_required: false
      }),
      isLoading: false,
      isError: null,
      isValidating: false
    });

    // Flag is enabled and one player has hours=-1 → canSubmit must be false.
    const editValues = buildValidEditValues((player, index) =>
      index === 0 ? { ...player, hours: -1 } : player
    );

    render(
      <SignupForm
        seasonId="1"
        platform={SeasonPlatform.Kanaliiga}
        editValues={editValues}
      />
    );

    const submitButton = screen.getByTestId("signup-submit-button");
    expect(submitButton).toBeDisabled();
  });

  it("disables submit when hours_played_required=true and a player has hours=-1", () => {
    mockUseSeasonDetails.mockReturnValue({
      seasonDetails: createMockSeasonDetails({
        platform: SeasonPlatform.Kanaliiga,
        profile_link_required: false,
        hours_played_required: true,
        faceit_rank_required: false,
        premier_rank_required: false
      }),
      isLoading: false,
      isError: null,
      isValidating: false
    });

    const editValues = buildValidEditValues((player, index) =>
      index === 2 ? { ...player, hours: -1 } : player
    );

    render(
      <SignupForm
        seasonId="1"
        platform={SeasonPlatform.Kanaliiga}
        editValues={editValues}
      />
    );

    expect(screen.getByTestId("signup-submit-button")).toBeDisabled();
  });

  it("enables submit when profile_link_required=false even though a player has hours=-1 (S1-AC-1)", () => {
    mockUseSeasonDetails.mockReturnValue({
      seasonDetails: createMockSeasonDetails({
        platform: SeasonPlatform.Kanaliiga,
        profile_link_required: false,
        hours_played_required: false,
        faceit_rank_required: false,
        premier_rank_required: false
      }),
      isLoading: false,
      isError: null,
      isValidating: false
    });

    // Disabled flag must not block submission even with sentinel value.
    const editValues = buildValidEditValues((player, index) =>
      index === 0 ? { ...player, hours: -1 } : player
    );

    render(
      <SignupForm
        seasonId="1"
        platform={SeasonPlatform.Kanaliiga}
        editValues={editValues}
      />
    );

    expect(screen.getByTestId("signup-submit-button")).not.toBeDisabled();
  });

  it("enables submit when premier_rank_required=false even though a player has rank=-1 (S1-AC-1)", () => {
    mockUseSeasonDetails.mockReturnValue({
      seasonDetails: createMockSeasonDetails({
        platform: SeasonPlatform.Kanaliiga,
        profile_link_required: false,
        hours_played_required: false,
        faceit_rank_required: false,
        premier_rank_required: false
      }),
      isLoading: false,
      isError: null,
      isValidating: false
    });

    const editValues = buildValidEditValues((player, index) =>
      index === 1 ? { ...player, rank: -1 } : player
    );

    render(
      <SignupForm
        seasonId="1"
        platform={SeasonPlatform.Kanaliiga}
        editValues={editValues}
      />
    );

    expect(screen.getByTestId("signup-submit-button")).not.toBeDisabled();
  });

  it("enables submit when faceit_rank_required=false even though a player has externalRank=-1 (S1-AC-1)", () => {
    mockUseSeasonDetails.mockReturnValue({
      seasonDetails: createMockSeasonDetails({
        platform: SeasonPlatform.Kanaliiga,
        profile_link_required: false,
        hours_played_required: false,
        faceit_rank_required: false,
        premier_rank_required: false
      }),
      isLoading: false,
      isError: null,
      isValidating: false
    });

    const editValues = buildValidEditValues((player, index) =>
      index === 3 ? { ...player, externalRank: -1 } : player
    );

    render(
      <SignupForm
        seasonId="1"
        platform={SeasonPlatform.Kanaliiga}
        editValues={editValues}
      />
    );

    expect(screen.getByTestId("signup-submit-button")).not.toBeDisabled();
  });

  it("disables submit when premier_rank_required=true and a player has rank=-1", () => {
    mockUseSeasonDetails.mockReturnValue({
      seasonDetails: createMockSeasonDetails({
        platform: SeasonPlatform.Kanaliiga,
        profile_link_required: false,
        hours_played_required: false,
        faceit_rank_required: false,
        premier_rank_required: true
      }),
      isLoading: false,
      isError: null,
      isValidating: false
    });

    const editValues = buildValidEditValues((player, index) =>
      index === 1 ? { ...player, rank: -1 } : player
    );

    render(
      <SignupForm
        seasonId="1"
        platform={SeasonPlatform.Kanaliiga}
        editValues={editValues}
      />
    );

    expect(screen.getByTestId("signup-submit-button")).toBeDisabled();
  });
});
