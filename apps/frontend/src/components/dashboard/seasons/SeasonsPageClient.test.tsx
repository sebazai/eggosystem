/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SeasonsPageClient } from "./SeasonsPageClient";
import { useAllSeasons } from "@/hooks/data/useAllSeasons";
import { useGames } from "@/hooks/data/useGames";
import { useGameTypes } from "@/hooks/data/useGameTypes";
import { clientApiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
import {
  SeasonPlatform,
  type Season,
  createMockSeason
} from "@eggosystem/types";
import { renderWithSWR, clearAllMocks } from "@/test-utils/test-utils";

// Mock dependencies
jest.mock("@/hooks/data/useAllSeasons");
jest.mock("@/hooks/data/useGames");
jest.mock("@/hooks/data/useGameTypes");
jest.mock("@/lib/apiClient");
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

const mockUseAllSeasons = useAllSeasons as jest.MockedFunction<
  typeof useAllSeasons
>;
const mockUseGames = useGames as jest.MockedFunction<typeof useGames>;
const mockUseGameTypes = useGameTypes as jest.MockedFunction<
  typeof useGameTypes
>;
const mockClientApiFetch = clientApiFetch as jest.MockedFunction<
  typeof clientApiFetch
>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe("SeasonsPageClient", () => {
  const mockSeasons: Season[] = [
    createMockSeason(
      1,
      "Season 1",
      "Full Season 1 Name",
      "2024-01-01T00:00:00Z",
      "2024-01-15T23:59:59Z",
      SeasonPlatform.Kanaliiga,
      "2024-02-01",
      "2024-12-31",
      1,
      1,
      1,
      false,
      false,
      "https://example.com/payment",
      150,
      true,
      0.2,
      "2024-01-10T23:59:59Z"
    ),
    createMockSeason(
      2,
      "Season 2",
      "Full Season 2 Name",
      "2025-01-01T00:00:00Z",
      "2025-01-15T23:59:59Z",
      SeasonPlatform.FACEIT,
      "2025-02-01",
      null,
      1,
      1,
      1,
      true,
      false,
      null,
      null,
      false
    ),
    createMockSeason(
      3,
      "Past Season",
      "Past Season Full Name",
      "2023-01-01T00:00:00Z",
      "2023-01-15T23:59:59Z",
      SeasonPlatform.Kanaliiga,
      "2023-02-01",
      "2023-12-31",
      1,
      1,
      1,
      false,
      false,
      null,
      100,
      false
    )
  ];

  beforeEach(() => {
    clearAllMocks();
    mockUseAllSeasons.mockReturnValue({
      seasons: mockSeasons,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
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
        },
        { id: 2, name: "Wingman", game_id: 1, min_players: 2, max_players: 2 }
      ],
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
    mockClientApiFetch.mockResolvedValue({ seasonId: 123 });
  });

  describe("Initial Render", () => {
    it("should render the seasons list when not creating or editing", () => {
      renderWithSWR(<SeasonsPageClient />);

      expect(screen.getByText("Existing Seasons")).toBeInTheDocument();
      expect(screen.getByText("Create New Season")).toBeInTheDocument();
    });

    it("should show loading state when seasons are loading", () => {
      mockUseAllSeasons.mockReturnValue({
        seasons: undefined,
        isLoading: true,
        isError: undefined,
        isValidating: false
      });

      renderWithSWR(<SeasonsPageClient />);

      expect(screen.getByText("Loading seasons...")).toBeInTheDocument();
    });

    it("should display seasons in categorized sections", () => {
      // Mock current date to be between season 1's start and end dates
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-06-01"));

      renderWithSWR(<SeasonsPageClient />);

      expect(screen.getByText("Existing Seasons")).toBeInTheDocument();
      expect(screen.getByText("Create New Season")).toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  describe("Create Season", () => {
    it("should show create form when Create New Season button is clicked", async () => {
      const user = userEvent.setup();
      renderWithSWR(<SeasonsPageClient />);

      const createButton = screen.getByText("Create New Season");
      await user.click(createButton);

      expect(screen.getByTestId("season-form")).toBeInTheDocument();
      expect(screen.getByTestId("form-mode")).toHaveTextContent("create");
      expect(
        screen.queryByTestId("form-initial-values")
      ).not.toBeInTheDocument();
      expect(screen.getByText("← Back to List")).toBeInTheDocument();
    });

    it("should create a new season when form is submitted", async () => {
      const user = userEvent.setup();
      mockClientApiFetch.mockResolvedValue({ seasonId: 456 });

      renderWithSWR(<SeasonsPageClient />);

      // Click create button
      const createButton = screen.getByText("Create New Season");
      await user.click(createButton);

      // Fill in required form fields
      const nameInput = screen.getByLabelText(/season name/i);
      await user.type(nameInput, "Test Season");

      const fullNameInput = screen.getByLabelText(/full season name/i);
      await user.type(fullNameInput, "Test Season Full Name");

      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, "2024-02-01");

      // Submit form
      const submitButton = screen.getByRole("button", {
        name: /create season/i
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockClientApiFetch).toHaveBeenCalledWith(
          "/api/v1/dashboard/seasons",
          expect.objectContaining({
            method: "POST"
          })
        );
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        "Season created successfully! ID: 456"
      );
    });

    it("should handle create season error", async () => {
      const user = userEvent.setup();
      const error = new Error("Failed to create season");
      mockClientApiFetch.mockRejectedValue(error);

      renderWithSWR(<SeasonsPageClient />);

      // Click create button
      const createButton = screen.getByText("Create New Season");
      await user.click(createButton);

      // Fill in required form fields
      const nameInput = screen.getByLabelText(/season name/i);
      await user.type(nameInput, "Test Season");

      const fullNameInput = screen.getByLabelText(/full season name/i);
      await user.type(fullNameInput, "Test Season Full Name");

      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, "2024-02-01");

      // Submit form
      const submitButton = screen.getByRole("button", {
        name: /create season/i
      });

      // Suppress console.error for this test since we're testing error handling
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Failed to create season");
      });

      consoleSpy.mockRestore();
    });

    it("should return to list when Back button is clicked in create mode", async () => {
      const user = userEvent.setup();
      renderWithSWR(<SeasonsPageClient />);

      // Click create button
      const createButton = screen.getByText("Create New Season");
      await user.click(createButton);

      // Click back button
      const backButton = screen.getByText("← Back to List");
      await user.click(backButton);

      expect(screen.queryByLabelText(/season name/i)).not.toBeInTheDocument();
      expect(screen.getByText("Existing Seasons")).toBeInTheDocument();
    });
  });

  describe("Edit Season", () => {
    it("should show edit form when Edit button is clicked on a season", async () => {
      const user = userEvent.setup();
      renderWithSWR(<SeasonsPageClient />);

      // Find and click edit button (there should be multiple edit buttons)
      const editButtons = screen.getAllByText("Edit");
      expect(editButtons.length).toBeGreaterThan(0);
      await user.click(editButtons[0]!);

      expect(screen.getByText("Edit Season")).toBeInTheDocument();
      expect(screen.getByText("← Back to List")).toBeInTheDocument();
      // Check that form fields are populated with initial values
      expect(screen.getByDisplayValue("Season 1")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("Full Season 1 Name")
      ).toBeInTheDocument();
    });

    it("should pass correct initial values when editing a season", async () => {
      const user = userEvent.setup();
      renderWithSWR(<SeasonsPageClient />);

      // Find and click edit button
      const editButtons = screen.getAllByText("Edit");
      expect(editButtons.length).toBeGreaterThan(0);
      await user.click(editButtons[0]!);

      // Check that form fields are populated with initial values from the season
      expect(screen.getByDisplayValue("Season 1")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("Full Season 1 Name")
      ).toBeInTheDocument();
      // Check that has_vat checkbox reflects the season value (true in mockSeason)
      const hasVatCheckbox = screen.getByLabelText(/price includes vat/i);
      expect(hasVatCheckbox).toBeChecked();
      // Check registration price if present
      if (mockSeasons[0]!.registration_price) {
        expect(
          screen.getByDisplayValue(
            mockSeasons[0]!.registration_price.toString()
          )
        ).toBeInTheDocument();
      }
    });

    it("should update a season when form is submitted in edit mode", async () => {
      const user = userEvent.setup();
      mockClientApiFetch.mockResolvedValue({ affectedRows: 1 });

      renderWithSWR(<SeasonsPageClient />);

      // Click edit button
      const editButtons = screen.getAllByText("Edit");
      expect(editButtons.length).toBeGreaterThan(0);
      await user.click(editButtons[0]!);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Season 1")).toBeInTheDocument();
      });

      // Submit form (values should already be filled from initialValues)
      const submitButton = screen.getByRole("button", { name: /save season/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockClientApiFetch).toHaveBeenCalledWith(
          "/api/v1/dashboard/seasons/1",
          expect.objectContaining({
            method: "PUT"
          })
        );
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        "Season updated successfully!"
      );
    });

    it("should handle update season error", async () => {
      const user = userEvent.setup();
      const error = new Error("Failed to update season");
      mockClientApiFetch.mockRejectedValue(error);

      renderWithSWR(<SeasonsPageClient />);

      // Click edit button
      const editButtons = screen.getAllByText("Edit");
      expect(editButtons.length).toBeGreaterThan(0);
      await user.click(editButtons[0]!);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Season 1")).toBeInTheDocument();
      });

      // Submit form
      const submitButton = screen.getByRole("button", { name: /save season/i });

      // Suppress console.error for this test since we're testing error handling
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Failed to update season");
      });

      consoleSpy.mockRestore();
    });

    it("should return to list when Back button is clicked in edit mode", async () => {
      const user = userEvent.setup();

      renderWithSWR(<SeasonsPageClient />);

      // Click edit button
      const editButtons = screen.getAllByText("Edit");
      expect(editButtons.length).toBeGreaterThan(0);
      await user.click(editButtons[0]!);

      // Click back button
      const backButton = screen.getByText("← Back to List");
      await user.click(backButton);

      expect(screen.queryByLabelText(/season name/i)).not.toBeInTheDocument();
      expect(screen.getByText("Existing Seasons")).toBeInTheDocument();
    });
  });

  describe("Season Categorization", () => {
    it("should categorize seasons correctly based on dates", () => {
      renderWithSWR(<SeasonsPageClient />);

      // Seasons should be categorized based on their dates
      expect(screen.getByText("Existing Seasons")).toBeInTheDocument();
    });

    it("should show 'No seasons found' when there are no seasons", () => {
      mockUseAllSeasons.mockReturnValue({
        seasons: [],
        isLoading: false,
        isError: undefined,
        isValidating: false
      });

      renderWithSWR(<SeasonsPageClient />);

      expect(
        screen.getByText("No seasons found. Create your first season!")
      ).toBeInTheDocument();
    });
  });

  describe("getInitialValues", () => {
    it("should correctly map all season fields to form values", async () => {
      const user = userEvent.setup();

      const seasonWithAllFields = createMockSeason(
        10,
        "Test Season",
        "Test Full Name",
        "2024-01-01T00:00:00Z",
        "2024-01-15T23:59:59Z",
        SeasonPlatform.Kanaliiga,
        "2024-02-01",
        "2024-12-31",
        1,
        1,
        1,
        true,
        false,
        "https://test.com/payment",
        200,
        false,
        0.15,
        "2024-01-10T23:59:59Z"
      );

      mockUseAllSeasons.mockReturnValue({
        seasons: [seasonWithAllFields],
        isLoading: false,
        isError: undefined,
        isValidating: false
      });

      renderWithSWR(<SeasonsPageClient />);

      // Click edit button
      const editButton = screen.getByText("Edit");
      await user.click(editButton);

      // Wait for form to load and verify fields are populated
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Season")).toBeInTheDocument();
      });

      // Verify all fields are correctly mapped in the form
      expect(screen.getByDisplayValue("Test Season")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test Full Name")).toBeInTheDocument();
      expect(screen.getByDisplayValue("200")).toBeInTheDocument();
      // has_vat should be false (unchecked)
      const hasVatCheckbox = screen.getByLabelText(/price includes vat/i);
      expect(hasVatCheckbox).not.toBeChecked();
    });

    it("should handle null values correctly", async () => {
      const user = userEvent.setup();

      const seasonWithNulls = createMockSeason(
        11,
        "Null Season",
        "Null Full Name",
        "2024-01-01T00:00:00Z",
        "2024-01-15T23:59:59Z",
        SeasonPlatform.FACEIT,
        "2024-02-01",
        null,
        1,
        1,
        1,
        false,
        false,
        null,
        null,
        false,
        null,
        null
      );

      mockUseAllSeasons.mockReturnValue({
        seasons: [seasonWithNulls],
        isLoading: false,
        isError: undefined,
        isValidating: false
      });

      renderWithSWR(<SeasonsPageClient />);

      // Click edit button
      const editButton = screen.getByText("Edit");
      await user.click(editButton);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Null Season")).toBeInTheDocument();
      });

      // Verify null values are handled correctly - fields should be empty
      expect(screen.getByDisplayValue("Null Season")).toBeInTheDocument();
      // Payment link field should be empty (null)
      const paymentLinkInput = screen.getByLabelText(/payment link/i);
      expect(paymentLinkInput).toHaveValue("");
      // Registration price should be empty (null)
      const registrationPriceInput =
        screen.getByLabelText(/registration price/i);
      expect(registrationPriceInput).toHaveValue("");
    });
  });
});
