import { render, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { TabPlayers } from "@/components/signup/signup-tab-players";
import { SeasonPlatform } from "@eggosystem/types";
import type { SignupFormValues } from "@eggosystem/types";

// Mock the API client
jest.mock("@/lib/apiClient", () => ({
  clientApiFetch: jest.fn(),
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

// Mock the icons component
jest.mock("@/components/icons", () => ({
  Spinner: () => <div data-testid="spinner">Loading...</div>,
  TooltipIcon: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  )
}));

// Mock the FaceIT level icon
jest.mock("@/components/profile/faceit-level", () => ({
  FaceITLevelIcon: ({ level }: { level: number }) => (
    <div data-testid={`faceit-level-${level}`}>FaceIT Level {level}</div>
  )
}));

// Mock the CS2 premier rank badge
jest.mock("@/components/profile/cs2-premier-rank", () => ({
  CS2PremierRankBadge: ({ rankScore }: { rankScore: number }) => (
    <div data-testid={`cs2-rank-${rankScore}`}>CS2 Rank {rankScore}</div>
  )
}));

// Mock Next.js Image component
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
  }) => <img src={src} alt={alt} width={width} height={height} />
}));

// Mock Next.js Link component
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    target,
    rel
  }: {
    children: React.ReactNode;
    href: string;
    target?: string;
    rel?: string;
  }) => (
    <a href={href} target={target} rel={rel}>
      {children}
    </a>
  )
}));

// Test wrapper component
const TestWrapper = ({
  players,
  platform = SeasonPlatform.FACEIT,
  seasonSteamAppId = 730,
  seasonId = "16"
}: {
  players: SignupFormValues["players"];
  platform?: SeasonPlatform;
  seasonSteamAppId?: number;
  seasonId?: string;
}) => {
  const { control, resetField, setValue, watch } = useForm<SignupFormValues>({
    defaultValues: {
      players,
      teamId: 999,
      organizationId: 999,
      captainHasReadTermAndConditions: false
    }
  });

  return (
    <TabPlayers
      control={control}
      resetField={resetField}
      setValue={setValue}
      watch={watch}
      playerErrorIndices={[]}
      seasonSteamAppId={seasonSteamAppId}
      platform={platform}
      seasonId={seasonId}
      validCaptainSelection={true}
      prefilledPlayerSteamIds={[]}
    />
  );
};

describe("External Rank Error", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show external rank error for player without FaceIT rank", async () => {
    const players = [
      {
        accountId: 15014,
        steamId: "66561198999999913",
        nickname: "NoFaceitRankPlayer",
        discord: "",
        captain: false,
        coCaptain: false,
        hasValidData: true,
        hasValidWorkEmail: true,
        isEmailVerified: true,
        hours: 1200,
        rank: 13,
        externalRank: -1 // This triggers the external rank error
      }
    ];

    render(<TestWrapper players={players} platform={SeasonPlatform.FACEIT} />);

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByTestId("external-rank-error-0")).toBeInTheDocument();
    });

    // Verify the error message content
    const errorElement = screen.getByTestId("external-rank-error-0");
    expect(errorElement).toHaveTextContent(
      "Could not detect external FACEIT rank for the player"
    );
    expect(errorElement).toHaveTextContent(
      "This could be due to temporary service issues or missing rank data"
    );
    expect(errorElement).toHaveTextContent(
      "Please try removing the steam id and adding it again"
    );
    expect(errorElement).toHaveTextContent(
      "or open a ticket in the Kanaliiga Discord if the problem persists"
    );
  });

  it("should not show external rank error for Kanaliiga platform", () => {
    const players = [
      {
        accountId: 15014,
        steamId: "66561198999999913",
        nickname: "NoFaceitRankPlayer",
        discord: "",
        captain: false,
        coCaptain: false,
        hasValidData: true,
        hasValidWorkEmail: true,
        isEmailVerified: true,
        hours: 1200,
        rank: 13,
        externalRank: -1 // This would trigger the error for FACEIT but not for Kanaliiga
      }
    ];

    render(
      <TestWrapper players={players} platform={SeasonPlatform.Kanaliiga} />
    );

    // The error should not be visible for Kanaliiga platform
    expect(
      screen.queryByTestId("external-rank-error-0")
    ).not.toBeInTheDocument();
  });

  it("should show external rank error with correct platform name", async () => {
    const players = [
      {
        accountId: 15014,
        steamId: "66561198999999913",
        nickname: "NoFaceitRankPlayer",
        discord: "",
        captain: false,
        coCaptain: false,
        hasValidData: true,
        hasValidWorkEmail: true,
        isEmailVerified: true,
        hours: 1200,
        rank: 13,
        externalRank: -1
      }
    ];

    render(<TestWrapper players={players} platform={SeasonPlatform.FACEIT} />);

    await waitFor(() => {
      expect(screen.getByTestId("external-rank-error-0")).toBeInTheDocument();
    });

    // Verify the platform name is correctly displayed
    const errorElement = screen.getByTestId("external-rank-error-0");
    expect(errorElement).toHaveTextContent("FACEIT");
  });

  it("should show external rank error for multiple players", async () => {
    const players = [
      {
        accountId: 15014,
        steamId: "66561198999999913",
        nickname: "NoFaceitRankPlayer1",
        discord: "",
        captain: false,
        coCaptain: false,
        hasValidData: true,
        hasValidWorkEmail: true,
        isEmailVerified: true,
        hours: 1200,
        rank: 13,
        externalRank: -1
      },
      {
        accountId: 15015,
        steamId: "66561198999999914",
        nickname: "NoFaceitRankPlayer2",
        discord: "",
        captain: false,
        coCaptain: false,
        hasValidData: true,
        hasValidWorkEmail: true,
        isEmailVerified: true,
        hours: 1000,
        rank: 11,
        externalRank: -1
      }
    ];

    render(<TestWrapper players={players} platform={SeasonPlatform.FACEIT} />);

    // Wait for both error messages to be visible
    await waitFor(() => {
      expect(screen.getByTestId("external-rank-error-0")).toBeInTheDocument();
      expect(screen.getByTestId("external-rank-error-1")).toBeInTheDocument();
    });

    // Verify both error messages contain the correct content
    const errorElement0 = screen.getByTestId("external-rank-error-0");
    const errorElement1 = screen.getByTestId("external-rank-error-1");

    expect(errorElement0).toHaveTextContent(
      "Could not detect external FACEIT rank for the player"
    );
    expect(errorElement1).toHaveTextContent(
      "Could not detect external FACEIT rank for the player"
    );
  });

  it("should not show external rank error when player has valid FaceIT rank", () => {
    const players = [
      {
        accountId: 15001,
        steamId: "66561198999999901",
        nickname: "ValidPlayer",
        discord: "",
        captain: false,
        coCaptain: false,
        hasValidData: true,
        hasValidWorkEmail: true,
        isEmailVerified: true,
        hours: 1500,
        rank: 15,
        externalRank: 10 // Valid FaceIT rank
      }
    ];

    render(<TestWrapper players={players} platform={SeasonPlatform.FACEIT} />);

    // The error should not be visible when player has valid FaceIT rank
    expect(
      screen.queryByTestId("external-rank-error-0")
    ).not.toBeInTheDocument();
  });

  it("should show external rank error only when externalRank is -1", () => {
    const players = [
      {
        accountId: 15014,
        steamId: "66561198999999913",
        nickname: "NoFaceitRankPlayer",
        discord: "",
        captain: false,
        coCaptain: false,
        hasValidData: true,
        hasValidWorkEmail: true,
        isEmailVerified: true,
        hours: 1200,
        rank: 13,
        externalRank: 0 // Not -1, so no error should show
      }
    ];

    render(<TestWrapper players={players} platform={SeasonPlatform.FACEIT} />);

    // The error should not be visible when externalRank is not -1
    expect(
      screen.queryByTestId("external-rank-error-0")
    ).not.toBeInTheDocument();
  });
});
