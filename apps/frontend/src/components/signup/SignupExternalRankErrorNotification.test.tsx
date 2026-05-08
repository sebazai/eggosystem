import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import { TabPlayers } from "@/components/signup/TabPlayers";
import {
  AabeSteamId,
  createMockSeasonDetails,
  NoFaceitRankPlayerSteamId,
  SeasonPlatform,
  ValidationFailurePlayerSteamId
} from "@eggosystem/types";
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
jest.mock("@/components/ui/icons", () => ({
  Spinner: () => <div data-testid="spinner">Loading...</div>,
  TooltipIcon: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  )
}));

// Mock the FaceIT level icon
jest.mock("@/components/profile/FaceITLevelIcon", () => ({
  FaceITLevelIcon: ({ level }: { level: number }) => (
    <div data-testid={`faceit-level-${level}`}>FaceIT Level {level}</div>
  )
}));

// Mock the CS2 premier rank badge
jest.mock("@/components/profile/CS2PremierRankBadge", () => ({
  CS2PremierRankBadge: () => (
    <div data-testid="cs2-premier-rank">CS2 Premier Rank</div>
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
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} />
  )
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
  seasonId = "16",
  faceitRankRequired = true,
  profileLinkRequired = false,
  hoursPlayedRequired = false
}: {
  players: SignupFormValues["players"];
  platform?: SeasonPlatform;
  seasonSteamAppId?: number;
  seasonId?: string;
  faceitRankRequired?: boolean;
  profileLinkRequired?: boolean;
  hoursPlayedRequired?: boolean;
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
          trigger={methods.trigger}
          playerErrorIndices={[]}
          seasonSteamAppId={seasonSteamAppId}
          platform={platform}
          seasonId={seasonId}
          validCaptainSelection={true}
          prefilledPlayerSteamIds={[]}
          isEditMode={false}
          submitInitiated={false}
          seasonDetails={createMockSeasonDetails({
            platform,
            faceit_rank_required: faceitRankRequired,
            profile_link_required: profileLinkRequired,
            hours_played_required: hoursPlayedRequired
          })}
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
        steamId: NoFaceitRankPlayerSteamId,
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
        steamId: NoFaceitRankPlayerSteamId,
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
        steamId: NoFaceitRankPlayerSteamId,
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
        steamId: NoFaceitRankPlayerSteamId,
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
        steamId: ValidationFailurePlayerSteamId,
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
        steamId: AabeSteamId,
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
        steamId: NoFaceitRankPlayerSteamId,
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
        steamId: NoFaceitRankPlayerSteamId,
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
        steamId: NoFaceitRankPlayerSteamId,
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

  it("should NOT show external rank error when faceit_rank_required is disabled", () => {
    const players = [
      {
        accountId: 15014,
        steamId: NoFaceitRankPlayerSteamId,
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

    render(
      <TestWrapper
        players={players}
        platform={SeasonPlatform.FACEIT}
        faceitRankRequired={false}
      />
    );

    // The external rank notification must not be present in the document at all,
    // regardless of accordion state.
    expect(
      screen.queryByTestId("external-rank-error-0")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Could not detect external.*rank for the player/)
    ).not.toBeInTheDocument();
  });

  it("should show green/valid visual state when faceit_rank_required is disabled and externalRank is -1", () => {
    const players = [
      {
        accountId: 15014,
        steamId: NoFaceitRankPlayerSteamId,
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

    render(
      <TestWrapper
        players={players}
        platform={SeasonPlatform.FACEIT}
        faceitRankRequired={false}
      />
    );

    // The steam-id-input should display the green/valid border class because the
    // disabled requirement must not contribute to an error state.
    const steamIdInput = screen.getByTestId("steam-id-input-0");
    expect(steamIdInput.className).toContain("border-green-500");
    expect(steamIdInput.className).not.toContain("border-red-500");

    // The accordion item must NOT have been forced open by the error effect —
    // because there is no error, the open-on-error logic should not trigger.
    const accordionItem = screen.getByTestId("player-accordion-0");
    expect(accordionItem.getAttribute("data-state")).toBe("closed");
  });

  it("should NOT show hours/profile notification when profile_link_required is disabled and hours is -1", () => {
    const players = [
      {
        accountId: 15014,
        steamId: NoFaceitRankPlayerSteamId,
        nickname: "NoFaceitRankPlayer",
        discord: "",
        captain: false,
        coCaptain: false,
        hasValidData: true,
        hasValidWorkEmail: true,
        isEmailVerified: true,
        hours: -1,
        rank: 13,
        externalRank: 5
      }
    ];

    render(
      <TestWrapper
        players={players}
        platform={SeasonPlatform.FACEIT}
        profileLinkRequired={false}
        hoursPlayedRequired={false}
      />
    );

    // Neither the hours-played notification nor the profile-link notification
    // should appear when both flags are disabled.
    expect(screen.queryByTestId("hours-error-0")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("profile-link-error-0")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Could not detect the hours for the player/)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Steam profile must be public/)
    ).not.toBeInTheDocument();
  });

  it("should show distinct profile-link notification when only profile_link_required is enabled and hours is -1", async () => {
    const players = [
      {
        accountId: 15014,
        steamId: NoFaceitRankPlayerSteamId,
        nickname: "NoFaceitRankPlayer",
        discord: "",
        captain: false,
        coCaptain: false,
        hasValidData: true,
        hasValidWorkEmail: true,
        isEmailVerified: true,
        hours: -1,
        rank: 13,
        externalRank: 5
      }
    ];

    render(
      <TestWrapper
        players={players}
        platform={SeasonPlatform.FACEIT}
        profileLinkRequired={true}
        hoursPlayedRequired={false}
      />
    );

    // Open the accordion to see the notification
    const accordionTrigger = screen.getByTestId("player-accordion-triggers");
    fireEvent.click(accordionTrigger);

    await waitFor(() => {
      expect(screen.getByTestId("profile-link-error-0")).toBeInTheDocument();
    });

    // Wording must be distinct from the hours-played notification — it should
    // mention the public Steam profile, not the hours-detection wording.
    expect(
      screen.getByText(/Steam profile must be public/)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Could not detect the hours for the player/)
    ).not.toBeInTheDocument();

    // The hours-error notification must NOT be rendered when only
    // profile_link_required is active.
    expect(screen.queryByTestId("hours-error-0")).not.toBeInTheDocument();
  });

  it("should show hours notification (not profile-link) when only hours_played_required is enabled", async () => {
    const players = [
      {
        accountId: 15014,
        steamId: NoFaceitRankPlayerSteamId,
        nickname: "NoFaceitRankPlayer",
        discord: "",
        captain: false,
        coCaptain: false,
        hasValidData: true,
        hasValidWorkEmail: true,
        isEmailVerified: true,
        hours: -1,
        rank: 13,
        externalRank: 5
      }
    ];

    render(
      <TestWrapper
        players={players}
        platform={SeasonPlatform.FACEIT}
        profileLinkRequired={false}
        hoursPlayedRequired={true}
      />
    );

    const accordionTrigger = screen.getByTestId("player-accordion-triggers");
    fireEvent.click(accordionTrigger);

    await waitFor(() => {
      expect(screen.getByTestId("hours-error-0")).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Could not detect the hours for the player/)
    ).toBeInTheDocument();
    // The distinct profile-link branch must not render in this configuration.
    expect(
      screen.queryByTestId("profile-link-error-0")
    ).not.toBeInTheDocument();
  });
});
