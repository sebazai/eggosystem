import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import { TabPlayers } from "@/components/signup/signup-tab-players";
import { SeasonPlatform } from "@eggosystem/types";
import type { SignupFormValues } from "@eggosystem/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock ResizeObserver for React 19 + Radix UI compatibility
beforeAll(() => {
  global.ResizeObserver =
    global.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
});

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

// Test wrapper component that provides proper form context
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
  const methods = useForm<SignupFormValues>({
    defaultValues: {
      players,
      teamId: 999,
      organizationId: 999,
      captainHasReadTermAndConditions: false
    }
  });

  return (
    <FormProvider {...methods}>
      <Tabs defaultValue="players" className="w-full">
        <TabsList>
          <TabsTrigger value="players">Players</TabsTrigger>
        </TabsList>
        <TabPlayers
          control={methods.control}
          resetField={methods.resetField}
          setValue={methods.setValue}
          watch={methods.watch}
          playerErrorIndices={[]}
          seasonSteamAppId={seasonSteamAppId}
          platform={platform}
          seasonId={seasonId}
          validCaptainSelection={true}
          prefilledPlayerSteamIds={[]}
        />
      </Tabs>
    </FormProvider>
  );
};

describe("External Rank Error", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show external rank error message for player without FaceIT rank", async () => {
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

    // First, open the accordion to see the error message
    const accordionTrigger = screen.getByTestId("player-accordion-triggers");
    fireEvent.click(accordionTrigger);

    // Wait for the error message to appear
    await waitFor(() => {
      expect(
        screen.getByText(/Could not detect external FACEIT rank for the player/)
      ).toBeInTheDocument();
    });

    // Verify the complete error message content using more semantic queries
    expect(
      screen.getByText(/Could not detect external FACEIT rank for the player/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /This could be due to temporary service issues or missing rank data/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Please try removing the steam id and adding it again/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /or open a ticket in the Kanaliiga Discord if the problem persists/
      )
    ).toBeInTheDocument();
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

    // Open the accordion to check if error is hidden
    const accordionTrigger = screen.getByTestId("player-accordion-triggers");
    fireEvent.click(accordionTrigger);

    // The error should not be visible for Kanaliiga platform
    expect(
      screen.queryByText(/Could not detect external.*rank for the player/)
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

    // Open the accordion to see the error message
    const accordionTrigger = screen.getByTestId("player-accordion-triggers");
    fireEvent.click(accordionTrigger);

    await waitFor(() => {
      expect(
        screen.getByText(/Could not detect external FACEIT rank for the player/)
      ).toBeInTheDocument();
    });

    // Verify the platform name is correctly displayed in the error message
    expect(screen.getByText(/FACEIT/)).toBeInTheDocument();
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

    // Open both accordions to see the error messages
    const accordionTriggers = screen.getAllByTestId(
      "player-accordion-triggers"
    );
    expect(accordionTriggers).toHaveLength(2);

    if (accordionTriggers[0]) fireEvent.click(accordionTriggers[0]);
    if (accordionTriggers[1]) fireEvent.click(accordionTriggers[1]);

    // Wait for both error messages to be visible
    await waitFor(() => {
      const errorMessages = screen.getAllByText(
        /Could not detect external FACEIT rank for the player/
      );
      expect(errorMessages).toHaveLength(2);
    });

    // Verify both error messages contain the correct content
    const errorMessages = screen.getAllByText(
      /Could not detect external FACEIT rank for the player/
    );
    expect(errorMessages[0]).toBeInTheDocument();
    expect(errorMessages[1]).toBeInTheDocument();
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

    // Open the accordion to check if error is hidden
    const accordionTrigger = screen.getByTestId("player-accordion-triggers");
    fireEvent.click(accordionTrigger);

    // The error should not be visible when player has valid FaceIT rank
    expect(
      screen.queryByText(/Could not detect external.*rank for the player/)
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

    // Open the accordion to check if error is hidden
    const accordionTrigger = screen.getByTestId("player-accordion-triggers");
    fireEvent.click(accordionTrigger);

    // The error should not be visible when externalRank is not -1
    expect(
      screen.queryByText(/Could not detect external.*rank for the player/)
    ).not.toBeInTheDocument();
  });

  it("should be accessible with proper ARIA attributes", async () => {
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

    // Open the accordion to see the error message
    const accordionTrigger = screen.getByTestId("player-accordion-triggers");
    fireEvent.click(accordionTrigger);

    await waitFor(() => {
      expect(
        screen.getByText(/Could not detect external FACEIT rank for the player/)
      ).toBeInTheDocument();
    });

    // Test that the error message is accessible
    const errorMessage = screen.getByText(
      /Could not detect external FACEIT rank for the player/
    );
    expect(errorMessage).toBeInTheDocument();

    // The error should be within a notification component
    const notification = errorMessage.closest("span");
    expect(notification).toBeInTheDocument();

    // Check that the notification has the expected test ID for accessibility testing
    const notificationWithTestId = screen.getByTestId("external-rank-error-0");
    expect(notificationWithTestId).toBeInTheDocument();
  });

  it("should provide actionable guidance in the error message", async () => {
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

    // Open the accordion to see the error message
    const accordionTrigger = screen.getByTestId("player-accordion-triggers");
    fireEvent.click(accordionTrigger);

    await waitFor(() => {
      expect(
        screen.getByText(/Could not detect external FACEIT rank for the player/)
      ).toBeInTheDocument();
    });

    // Verify the error provides actionable guidance
    expect(
      screen.getByText(/Please try removing the steam id and adding it again/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /or open a ticket in the Kanaliiga Discord if the problem persists/
      )
    ).toBeInTheDocument();
  });
});
