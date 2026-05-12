import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { CasterApplicationPageContent } from "./CasterApplicationPageContent";
import { useAuth } from "@/context/AuthContext";
import {
  useMyCasterApplications,
  useSubmitCasterApplication
} from "@/hooks/data/useCasterApplication";
import { useEmailsVerified } from "@/hooks/data/useEmailsVerified";
import type { UserFullPayload } from "@eggosystem/types";

jest.mock("@/context/AuthContext");
jest.mock("@/hooks/data/useCasterApplication");
jest.mock("@/hooks/data/useEmailsVerified");

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseMyCasterApplications =
  useMyCasterApplications as jest.MockedFunction<
    typeof useMyCasterApplications
  >;
const mockUseEmailsVerified = useEmailsVerified as jest.MockedFunction<
  typeof useEmailsVerified
>;
const mockUseSubmitCasterApplication =
  useSubmitCasterApplication as jest.MockedFunction<
    typeof useSubmitCasterApplication
  >;

const mockOrganizer = { id: 1, name: "Kanaliiga" };

const mockUser = {
  account_id: 1,
  provider_id: "76561198000000000",
  discordLinked: true,
  roles: [],
  nickname: "testuser",
  provider: "steam",
  acceptedPrivacyPolicy: true,
  acceptedMarketing: false,
  isPersonalEmail: false
} as UserFullPayload;

describe("CasterApplicationPageContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      checkAuth: jest.fn(),
      logout: jest.fn()
    });
    mockUseMyCasterApplications.mockReturnValue({
      applications: [],
      isLoading: false,
      isError: undefined,
      isValidating: false,
      mutate: jest.fn()
    });
    mockUseEmailsVerified.mockReturnValue({
      emailsVerified: {
        work_email_verified: true,
        work_email_token_expires_at: null
      },
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
    mockUseSubmitCasterApplication.mockReturnValue({
      submit: jest.fn().mockResolvedValue(undefined),
      isSubmitting: false
    });
  });

  it("should show verify email message when email not verified", () => {
    mockUseEmailsVerified.mockReturnValue({
      emailsVerified: {
        work_email_verified: false,
        work_email_token_expires_at: null
      },
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    render(<CasterApplicationPageContent organizer={mockOrganizer} />);

    expect(
      screen.getByText(
        /verify your work email in your profile to apply as a caster/i
      )
    ).toBeInTheDocument();
  });

  it("should show link Discord message when Discord not linked", () => {
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, discordLinked: false },
      loading: false,
      checkAuth: jest.fn(),
      logout: jest.fn()
    });
    mockUseEmailsVerified.mockReturnValue({
      emailsVerified: {
        work_email_verified: true,
        work_email_token_expires_at: null
      },
      isLoading: false,
      isError: undefined,
      isValidating: false
    });

    render(<CasterApplicationPageContent organizer={mockOrganizer} />);

    expect(
      screen.getByText(
        /link your discord account in your profile to apply as a caster/i
      )
    ).toBeInTheDocument();
  });

  it("should show rules and form when prerequisites met", async () => {
    render(<CasterApplicationPageContent organizer={mockOrganizer} />);

    await waitFor(() => {
      expect(screen.getByText("Streaming rules")).toBeInTheDocument();
    });
    expect(screen.getByText("Kanaliiga")).toBeInTheDocument();
    expect(screen.getByLabelText(/stream url/i)).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: /i have read the above information/i
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /submit application/i })
    ).toBeInTheDocument();
  });

  it("should show pending message when application is pending", async () => {
    mockUseMyCasterApplications.mockReturnValue({
      applications: [
        {
          id: 1,
          organizer_id: 1,
          account_id: 1,
          caster_url: "https://twitch.tv/foo",
          approved_terms_and_conditions: true,
          approved_by: null,
          approved_at: null,
          rejected_by: null,
          rejected_at: null,
          rejection_reason: null,
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-01T00:00:00.000Z"
        }
      ],
      isLoading: false,
      isError: undefined,
      isValidating: false,
      mutate: jest.fn()
    });

    render(<CasterApplicationPageContent organizer={mockOrganizer} />);

    await waitFor(() => {
      expect(
        screen.getByText(/your application is under review/i)
      ).toBeInTheDocument();
    });
  });
});
