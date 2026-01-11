import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CasterUrlSettings } from "./CasterUrlSettings";
import { clientApiFetch } from "@/lib/apiClient";
import { toast } from "sonner";

// Mock dependencies
jest.mock("@/lib/apiClient");
jest.mock("sonner");

const mockClientApiFetch = clientApiFetch as jest.MockedFunction<
  typeof clientApiFetch
>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe("CasterUrlSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render caster URL settings for caster users", async () => {
    mockClientApiFetch.mockResolvedValue({ stream_url: null });

    render(<CasterUrlSettings canManageUrls={true} />);

    expect(screen.getByText("Caster Settings")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Set your default stream URL for quick match reservations"
      )
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Default Stream URL")).toBeInTheDocument();
  });

  it("should not render for non-caster users", () => {
    render(<CasterUrlSettings canManageUrls={false} />);

    expect(screen.queryByText("Caster Settings")).not.toBeInTheDocument();
  });

  it("should load and display existing default URL", async () => {
    const existingUrl = "https://twitch.tv/existingcaster";
    mockClientApiFetch.mockResolvedValue({ stream_url: existingUrl });

    render(<CasterUrlSettings canManageUrls={true} />);

    await waitFor(() => {
      const input = screen.getByLabelText(
        "Default Stream URL"
      ) as HTMLInputElement;
      expect(input.value).toBe(existingUrl);
    });

    // Should show delete button when URL exists
    await waitFor(() => {
      expect(screen.getByTitle("Delete default URL")).toBeInTheDocument();
    });
  });

  it("should successfully save a new default URL", async () => {
    const user = userEvent.setup();
    mockClientApiFetch
      .mockResolvedValueOnce({ stream_url: null }) // Initial load
      .mockResolvedValueOnce({}); // Save request

    render(<CasterUrlSettings canManageUrls={true} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByLabelText("Default Stream URL")).toBeInTheDocument();
    });

    // Enter new URL
    const urlInput = screen.getByLabelText("Default Stream URL");
    await user.type(urlInput, "https://twitch.tv/newcaster");

    // Submit form
    const saveButton = screen.getByRole("button", {
      name: /save default url/i
    });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/accounts/caster/default-url",
        {
          method: "POST",
          body: JSON.stringify({
            stream_url: "https://twitch.tv/newcaster"
          })
        }
      );
    });

    expect(mockToast.success).toHaveBeenCalledWith(
      "Default stream URL saved successfully!"
    );
  });

  it("should successfully delete existing default URL", async () => {
    const user = userEvent.setup();
    const existingUrl = "https://twitch.tv/existingcaster";
    mockClientApiFetch
      .mockResolvedValueOnce({ stream_url: existingUrl }) // Initial load
      .mockResolvedValueOnce({}); // Delete request

    render(<CasterUrlSettings canManageUrls={true} />);

    // Wait for URL to load
    await waitFor(() => {
      const input = screen.getByLabelText(
        "Default Stream URL"
      ) as HTMLInputElement;
      expect(input.value).toBe(existingUrl);
    });

    // Click delete button
    const deleteButton = screen.getByTitle("Delete default URL");
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/accounts/caster/default-url",
        { method: "DELETE" }
      );
    });

    expect(mockToast.success).toHaveBeenCalledWith(
      "Default stream URL deleted successfully!"
    );
  });

  it("should validate URL format", async () => {
    const user = userEvent.setup();
    mockClientApiFetch.mockResolvedValue({ stream_url: null });

    render(<CasterUrlSettings canManageUrls={true} />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByLabelText("Default Stream URL")).toBeInTheDocument();
    });

    // Enter invalid URL
    const urlInput = screen.getByLabelText("Default Stream URL");
    await user.clear(urlInput);
    await user.type(urlInput, "not-a-url");

    // Trigger validation by blurring the input
    await user.tab();

    // Try to submit
    const saveButton = screen.getByRole("button", {
      name: /save default url/i
    });
    await user.click(saveButton);

    // Should show validation error or prevent API call
    await waitFor(() => {
      // Check if validation error is shown OR API wasn't called due to validation
      try {
        expect(
          screen.getByText("Please enter a valid URL")
        ).toBeInTheDocument();
      } catch {
        // If error text isn't found, check that API wasn't called due to validation failure
        expect(mockClientApiFetch).toHaveBeenCalledTimes(1); // Only the initial load call
      }
    });
  });

  it("should handle API errors when saving", async () => {
    const user = userEvent.setup();
    const errorMessage = "Failed to save";
    mockClientApiFetch
      .mockResolvedValueOnce({ stream_url: null })
      .mockRejectedValueOnce(new Error(errorMessage));

    render(<CasterUrlSettings canManageUrls={true} />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByLabelText("Default Stream URL")).toBeInTheDocument();
    });

    // Enter URL and submit
    const urlInput = screen.getByLabelText("Default Stream URL");
    await user.type(urlInput, "https://twitch.tv/testcaster");

    const saveButton = screen.getByRole("button", {
      name: /save default url/i
    });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  it("should disable save button when form is pristine", async () => {
    mockClientApiFetch.mockResolvedValue({
      stream_url: "https://twitch.tv/existing"
    });

    render(<CasterUrlSettings canManageUrls={true} />);

    // Wait for form to load with existing data
    await waitFor(() => {
      const saveButton = screen.getByRole("button", {
        name: /save default url/i
      });
      expect(saveButton).toBeDisabled();
    });
  });

  it("should enable save button when form is dirty", async () => {
    const user = userEvent.setup();
    mockClientApiFetch.mockResolvedValue({
      stream_url: "https://twitch.tv/existing"
    });

    render(<CasterUrlSettings canManageUrls={true} />);

    // Wait for form to load
    await waitFor(() => {
      const input = screen.getByLabelText(
        "Default Stream URL"
      ) as HTMLInputElement;
      expect(input.value).toBe("https://twitch.tv/existing");
    });

    // Modify the input
    const urlInput = screen.getByLabelText("Default Stream URL");
    await user.clear(urlInput);
    await user.type(urlInput, "https://twitch.tv/modified");

    // Save button should be enabled
    const saveButton = screen.getByRole("button", {
      name: /save default url/i
    });
    expect(saveButton).not.toBeDisabled();
  });
});
