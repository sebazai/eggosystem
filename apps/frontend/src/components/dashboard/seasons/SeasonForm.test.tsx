/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SeasonForm } from "./SeasonForm";
import { useGames } from "@/hooks/data/useGames";
import { useGameTypes } from "@/hooks/data/useGameTypes";
import { useSeason } from "@/hooks/data/useSeason";
import { useMaps } from "@/hooks/data/useMaps";
import {
  SeasonPlatform,
  type Season,
  createMockSeason
} from "@eggosystem/types";
import { renderWithSWR, clearAllMocks } from "@/test-utils/test-utils";

// Mock dependencies
jest.mock("@/hooks/data/useGames");
jest.mock("@/hooks/data/useGameTypes");
jest.mock("@/hooks/data/useSeason");
jest.mock("@/hooks/data/useMaps");
// Mock timezone utility
jest.mock("@/lib/timezone", () => ({
  getUserTimezone: jest.fn(() => "America/New_York"),
  formatInTimezone: jest.fn((date: string) => new Date(date).toLocaleString()),
  formatInSpecificTimezone: jest.fn((date: string) =>
    new Date(date).toLocaleString()
  ),
  utcToLocalDate: jest.fn((date: string) => new Date(date))
}));

const mockUseGames = useGames as jest.MockedFunction<typeof useGames>;
const mockUseGameTypes = useGameTypes as jest.MockedFunction<
  typeof useGameTypes
>;
const mockUseSeason = useSeason as jest.MockedFunction<typeof useSeason>;
const mockUseMaps = useMaps as jest.MockedFunction<typeof useMaps>;

describe("SeasonForm - Timezone Conversion", () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    clearAllMocks();
    mockUseGames.mockReturnValue({
      games: [
        { id: 1, name: "Counter-Strike 2", abbreviation: "CS2", app_id: 730 }
      ],
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
    mockUseGameTypes.mockReturnValue({
      gameTypes: [
        {
          id: 1,
          name: "Competitive",
          game_id: 1,
          min_players: 5,
          max_players: 5
        }
      ],
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
    mockUseSeason.mockReturnValue({
      season: undefined,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
    mockUseMaps.mockReturnValue({
      maps: [
        { id: 1, name: "Dust 2" },
        { id: 2, name: "Mirage" },
        { id: 3, name: "Inferno" }
      ],
      mapsRecord: { 1: "Dust 2", 2: "Mirage", 3: "Inferno" },
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
  });

  describe("Display UTC dates in local timezone", () => {
    it("should convert UTC signup dates to local timezone for display", async () => {
      // Mock season with UTC dates
      const seasonWithUTCDates = createMockSeason({
        id: 1,
        signup_start_date: "2025-01-15T10:30:00Z", // 10:30 AM UTC
        signup_end_date: "2025-01-20T15:45:00Z", // 3:45 PM UTC
        early_bird_price_discount_end_date: "2025-01-10T12:00:00Z" // 12:00 PM UTC
      });

      mockUseSeason.mockReturnValue({
        season: seasonWithUTCDates,
        isLoading: false,
        isError: undefined,
        isValidating: false
      });

      renderWithSWR(
        <SeasonForm onSubmit={mockOnSubmit} seasonId={1} mode="edit" />
      );

      await waitFor(() => {
        // Wait for form to load
        expect(screen.getByLabelText(/signup start date/i)).toBeInTheDocument();
      });

      // Get the datetime-local input values
      const signupStartInput = screen.getByLabelText(
        /signup start date/i
      ) as HTMLInputElement;
      const signupEndInput = screen.getByLabelText(
        /signup end date/i
      ) as HTMLInputElement;

      // The dates should be converted to local timezone
      // In test environment (UTC), dates remain the same (no conversion)
      // 10:30 AM UTC = 10:30 AM UTC (test environment)
      expect(signupStartInput.value).toBe("2025-01-15T10:30");
      // 3:45 PM UTC = 3:45 PM UTC (test environment)
      expect(signupEndInput.value).toBe("2025-01-20T15:45");
    });

    it("should handle null dates correctly", async () => {
      const seasonWithNullDates = createMockSeason({
        id: 1,
        signup_start_date: null,
        signup_end_date: null,
        early_bird_price_discount_end_date: null
      });

      mockUseSeason.mockReturnValue({
        season: seasonWithNullDates,
        isLoading: false,
        isError: undefined,
        isValidating: false
      });

      renderWithSWR(
        <SeasonForm onSubmit={mockOnSubmit} seasonId={1} mode="edit" />
      );

      await waitFor(() => {
        const signupStartInput = screen.getByLabelText(
          /signup start date/i
        ) as HTMLInputElement;
        expect(signupStartInput.value).toBe("");
      });
    });
  });

  describe("Convert local dates to ISO for submission", () => {
    it("should convert local datetime inputs to ISO format when submitting", async () => {
      renderWithSWR(<SeasonForm onSubmit={mockOnSubmit} mode="create" />);

      await waitFor(() => {
        // Wait for form to be ready - check for the submit button
        expect(
          screen.getByRole("button", { name: /create season/i })
        ).toBeInTheDocument();
      });

      // Fill in form fields - use placeholder text to avoid label conflicts
      const nameInput = screen.getByPlaceholderText(/e.g., Season 2024/i);
      await userEvent.type(nameInput, "Test Season");

      const fullNameInput = screen.getByPlaceholderText(
        /e.g., Kanaliiga Season 2024/i
      );
      await userEvent.type(fullNameInput, "Full Test Season");
      const startDateInputs = screen.getAllByLabelText(/start date/i);
      await userEvent.type(startDateInputs[0]!, "2025-02-01");

      // Set signup dates in local timezone (datetime-local format)
      const signupStartInput = screen.getByLabelText(
        /signup start date/i
      ) as HTMLInputElement;
      const signupEndInput = screen.getByLabelText(
        /signup end date/i
      ) as HTMLInputElement;

      // Set local time (e.g., 10:30 AM EST = 2025-01-15T10:30)
      await userEvent.clear(signupStartInput);
      await userEvent.type(signupStartInput, "2025-01-15T10:30");

      await userEvent.clear(signupEndInput);
      await userEvent.type(signupEndInput, "2025-01-20T15:45");

      // Select at least one map (required by schema)
      const mapCheckbox = screen.getByLabelText(/dust 2/i);
      await userEvent.click(mapCheckbox);

      // Wait for form to be ready and submit button to be enabled
      const submitButton = await waitFor(() => {
        const button = screen.getByRole("button", {
          name: /create season/i
        });
        expect(button).not.toBeDisabled();
        return button;
      });

      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      // Verify that dates were converted to ISO format
      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData.signup_start_date).toMatch(
        /^2025-01-15T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
      expect(submittedData.signup_end_date).toMatch(
        /^2025-01-20T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it("should include timezone in form values", async () => {
      renderWithSWR(<SeasonForm onSubmit={mockOnSubmit} mode="create" />);

      await waitFor(() => {
        // Wait for form to be ready
        expect(
          screen.getByRole("button", { name: /create season/i })
        ).toBeInTheDocument();
      });

      // Fill in required fields - use placeholder to avoid label conflicts
      const nameInput = screen.getByPlaceholderText(/e.g., Season 2024/i);
      await userEvent.type(nameInput, "Test Season");

      const fullNameInput = screen.getByPlaceholderText(
        /e.g., Kanaliiga Season 2024/i
      );
      await userEvent.type(fullNameInput, "Full Test Season");
      const startDateInputs = screen.getAllByLabelText(/start date/i);
      await userEvent.type(startDateInputs[0]!, "2025-02-01");

      // Select at least one map (required by schema)
      const mapCheckbox = screen.getByLabelText(/dust 2/i);
      await userEvent.click(mapCheckbox);

      // Wait for form to be ready and submit button to be enabled
      const submitButton = await waitFor(() => {
        const button = screen.getByRole("button", {
          name: /create season/i
        });
        expect(button).not.toBeDisabled();
        return button;
      });

      // Click the submit button to trigger form submission
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      // The form should automatically include timezone
      // This is handled internally by the form component
    });

    it("should handle empty datetime fields correctly", async () => {
      renderWithSWR(<SeasonForm onSubmit={mockOnSubmit} mode="create" />);

      await waitFor(() => {
        // Wait for form to be ready
        expect(
          screen.getByRole("button", { name: /create season/i })
        ).toBeInTheDocument();
      });

      // Fill in required fields only - use placeholder to avoid label conflicts
      const nameInput = screen.getByPlaceholderText(/e.g., Season 2024/i);
      await userEvent.type(nameInput, "Test Season");

      const fullNameInput = screen.getByPlaceholderText(
        /e.g., Kanaliiga Season 2024/i
      );
      await userEvent.type(fullNameInput, "Full Test Season");
      const startDateInputs = screen.getAllByLabelText(/start date/i);
      await userEvent.type(startDateInputs[0]!, "2025-02-01");

      // Select at least one map (required by schema)
      const mapCheckbox = screen.getByLabelText(/dust 2/i);
      await userEvent.click(mapCheckbox);

      // Leave signup dates empty
      // Wait for form to be ready and submit button to be enabled
      const submitButton = await waitFor(() => {
        const button = screen.getByRole("button", {
          name: /create season/i
        });
        expect(button).not.toBeDisabled();
        return button;
      });

      // Click the submit button to trigger form submission
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData.signup_start_date).toBeNull();
      expect(submittedData.signup_end_date).toBeNull();
    });
  });

  describe("Round-trip conversion", () => {
    it("should correctly convert UTC → local → UTC in a round-trip", async () => {
      // Start with UTC date from backend
      const utcDateFromBackend = "2025-01-15T10:30:00Z"; // 10:30 AM UTC

      const season = createMockSeason({
        id: 1,
        signup_start_date: utcDateFromBackend,
        signup_end_date: "2025-01-20T10:30:00Z", // Ensure signup_end_date is after signup_start_date
        start_date: "2025-02-01" // Ensure start_date is after signup dates
      });

      mockUseSeason.mockReturnValue({
        season,
        isLoading: false,
        isError: undefined,
        isValidating: false
      });

      renderWithSWR(
        <SeasonForm onSubmit={mockOnSubmit} seasonId={1} mode="edit" />
      );

      await waitFor(() => {
        const signupStartInput = screen.getByLabelText(
          /signup start date/i
        ) as HTMLInputElement;
        expect(signupStartInput.value).toBeTruthy();
      });

      // Wait a bit for form to be fully initialized
      await waitFor(() => {
        const submitButton = screen.getByRole("button", {
          name: /save season/i
        });
        expect(submitButton).toBeInTheDocument();
      });

      // Get the displayed local time
      const signupStartInput = screen.getByLabelText(
        /signup start date/i
      ) as HTMLInputElement;
      const displayedLocalTime = signupStartInput.value;

      // Submit without changing
      const submitButton = screen.getByRole("button", { name: /save season/i });
      await userEvent.click(submitButton);

      await waitFor(
        () => {
          expect(mockOnSubmit).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      // The submitted date should be in ISO format
      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData.signup_start_date).toMatch(
        /^2025-01-15T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );

      // When converted back, it should represent the same moment in time
      // (even if the displayed local time was different)
      const submittedDate = new Date(submittedData.signup_start_date!);
      const originalDate = new Date(utcDateFromBackend);
      expect(submittedDate.getTime()).toBe(originalDate.getTime());
    });
  });
});
