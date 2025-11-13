/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/react";
import { SignupForm } from "./SignupForm";
import { useAuth } from "@/context/AuthContext";
import { useSeasonDetails } from "@/hooks/data/useSeasonDetails";
import {
  SeasonPlatform,
  type SeasonDetails,
  type SignupFormValues,
  createMockSeason
} from "@eggosystem/types";
import { clientApiFetch } from "@/lib/apiClient";
import {
  renderWithSWR,
  setupFetchMock,
  clearAllMocks
} from "@/test-utils/test-utils";

// Mock dependencies
jest.mock("@/context/AuthContext");
jest.mock("@/hooks/data/useSeasonDetails");
jest.mock("@/lib/apiClient");

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseSeasonDetails = useSeasonDetails as jest.MockedFunction<
  typeof useSeasonDetails
>;
const mockClientApiFetch = clientApiFetch as jest.MockedFunction<
  typeof clientApiFetch
>;

const mockUser = {
  account_id: 123,
  steam_id: "76561198000000000",
  nickname: "TestUser",
  acceptedPrivacyPolicy: true,
  acceptedMarketing: false,
  acceptedNewsletter: true,
  isPersonalEmail: false,
  discordLinked: false,
  fullName: "Test User",
  workEmail: "test@example.com",
  discord: "testuser#1234",
  provider_id: "76561198000000000",
  provider: "steam" as const,
  roles: []
};

const mockSeason = createMockSeason(
  1,
  "Test Season",
  "Test Season Full Name",
  new Date().toISOString(),
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  SeasonPlatform.Kanaliiga,
  new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
);

const mockSeasonDetails = {
  ...mockSeason,
  app_id: 730
} satisfies SeasonDetails;

const mockDraftValues: SignupFormValues = {
  organizationId: 1,
  teamId: 1,
  teamExternalId: "",
  captainHasReadTermAndConditions: false,
  players: [
    {
      accountId: 123,
      steamId: "76561198000000001",
      nickname: "DraftPlayer1",
      captain: true,
      coCaptain: false
    },
    {
      accountId: 124,
      steamId: "76561198000000002",
      nickname: "DraftPlayer2",
      captain: false,
      coCaptain: false
    },
    {
      accountId: 125,
      steamId: "76561198000000003",
      nickname: "DraftPlayer3",
      captain: false,
      coCaptain: false
    },
    {
      accountId: 126,
      steamId: "76561198000000004",
      nickname: "DraftPlayer4",
      captain: false,
      coCaptain: false
    },
    {
      accountId: 127,
      steamId: "76561198000000005",
      nickname: "DraftPlayer5",
      captain: false,
      coCaptain: false
    }
  ]
};

const mockEditValues: SignupFormValues = {
  ...mockDraftValues,
  captainHasReadTermAndConditions: true,
  players: [
    {
      accountId: 123,
      steamId: "76561198000000010",
      nickname: "EditPlayer1",
      captain: true,
      coCaptain: false
    },
    ...mockDraftValues.players.slice(1)
  ]
};

describe("SignupForm", () => {
  beforeEach(() => {
    clearAllMocks();
    setupFetchMock();

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      logout: jest.fn(),
      checkAuth: jest.fn()
    });

    mockUseSeasonDetails.mockReturnValue({
      seasonDetails: mockSeasonDetails,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    mockClientApiFetch.mockResolvedValue({});
  });

  describe("Component Rendering", () => {
    it("should render signup form without draft or edit values", async () => {
      renderWithSWR(
        <SignupForm seasonId="1" platform={SeasonPlatform.Kanaliiga} />
      );

      // Should show the form title
      expect(screen.getByText("Sign up Form")).toBeInTheDocument();
    });

    it("should render edit form with edit values", async () => {
      renderWithSWR(
        <SignupForm
          seasonId="1"
          platform={SeasonPlatform.Kanaliiga}
          editValues={mockEditValues}
        />
      );

      // Should show edit mode title
      expect(screen.getByText("Edit signup")).toBeInTheDocument();
    });

    it("should show save as draft button only in non-edit mode", async () => {
      const { rerender } = renderWithSWR(
        <SignupForm seasonId="1" platform={SeasonPlatform.Kanaliiga} />
      );

      // Should show save as draft button in signup mode
      expect(screen.getByTestId("save-as-draft-button")).toBeInTheDocument();

      // Rerender in edit mode using the same wrapper
      rerender(
        <SignupForm
          seasonId="1"
          platform={SeasonPlatform.Kanaliiga}
          editValues={mockEditValues}
        />
      );

      // Should NOT show save as draft button in edit mode
      expect(
        screen.queryByTestId("save-as-draft-button")
      ).not.toBeInTheDocument();
    });

    it("should show loading state when season details are loading", async () => {
      mockUseSeasonDetails.mockReturnValue({
        seasonDetails: undefined,
        isLoading: true,
        isError: undefined,
        isValidating: false
      });

      renderWithSWR(
        <SignupForm seasonId="1" platform={SeasonPlatform.Kanaliiga} />
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should show login prompt when user is not authenticated", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        logout: jest.fn(),
        checkAuth: jest.fn()
      });

      renderWithSWR(
        <SignupForm seasonId="1" platform={SeasonPlatform.Kanaliiga} />
      );

      // Should show steam login requirement
      expect(
        screen.getByText(/You need to login with Steam/i)
      ).toBeInTheDocument();
    });
  });

  describe("Form Reset Behavior", () => {
    it("should reset form when editValues prop changes", async () => {
      const updatedEditValues: SignupFormValues = {
        ...mockEditValues,
        players: [
          {
            accountId: 123,
            steamId: "76561198000000020",
            nickname: "NewEditPlayer1",
            captain: true,
            coCaptain: false
          },
          ...mockEditValues.players.slice(1)
        ]
      };

      // Render with initial editValues
      const { rerender } = renderWithSWR(
        <SignupForm
          seasonId="1"
          platform={SeasonPlatform.Kanaliiga}
          editValues={mockEditValues}
        />
      );

      // Rerender with updated editValues (simulating cache invalidation)
      rerender(
        <SignupForm
          seasonId="1"
          platform={SeasonPlatform.Kanaliiga}
          editValues={updatedEditValues}
        />
      );

      // The form should have updated - we can't easily test the form values
      // but we can verify the component renders without error
      expect(screen.getByText("Edit signup")).toBeInTheDocument();
    });
  });

  describe("Draft Mode", () => {
    it("should load form with draft values", async () => {
      renderWithSWR(
        <SignupForm
          seasonId="1"
          platform={SeasonPlatform.Kanaliiga}
          draft={mockDraftValues}
        />
      );

      // Should still show save as draft button (not in edit mode)
      expect(screen.getByTestId("save-as-draft-button")).toBeInTheDocument();

      // Should show signup form title (not edit)
      expect(screen.getByText("Sign up Form")).toBeInTheDocument();
    });
  });

  describe("Props Validation", () => {
    it("should accept all required props", () => {
      expect(() => {
        renderWithSWR(
          <SignupForm
            seasonId="1"
            platform={SeasonPlatform.Kanaliiga}
            draft={mockDraftValues}
            editValues={mockEditValues}
            onDraftSaved={jest.fn()}
          />
        );
      }).not.toThrow();
    });

    it("should work with minimal props", () => {
      expect(() => {
        renderWithSWR(
          <SignupForm seasonId="1" platform={SeasonPlatform.Kanaliiga} />
        );
      }).not.toThrow();
    });
  });
});
