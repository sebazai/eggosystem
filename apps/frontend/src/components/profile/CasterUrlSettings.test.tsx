import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CasterUrlSettings } from "./CasterUrlSettings";
import { clientApiFetch } from "@/lib/apiClient";
import { toast } from "sonner";

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
    mockClientApiFetch.mockResolvedValue({ urls: [] });

    render(<CasterUrlSettings canManageUrls={true} />);

    await waitFor(() => {
      expect(screen.getByText("Caster Settings")).toBeInTheDocument();
    });
    expect(
      screen.getByText(/add multiple stream urls and choose which one/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Add stream URL")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add url/i })
    ).toBeInTheDocument();
  });

  it("should not render for non-caster users", () => {
    render(<CasterUrlSettings canManageUrls={false} />);

    expect(screen.queryByText("Caster Settings")).not.toBeInTheDocument();
  });

  it("should load and display existing URLs", async () => {
    const urls = [
      {
        id: 1,
        stream_url: "https://twitch.tv/caster1",
        is_default: true
      },
      {
        id: 2,
        stream_url: "https://youtube.com/caster2",
        is_default: false
      }
    ];
    mockClientApiFetch.mockResolvedValue({ urls });

    render(<CasterUrlSettings canManageUrls={true} />);

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "https://twitch.tv/caster1" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "https://youtube.com/caster2" })
      ).toBeInTheDocument();
      expect(screen.getByText("Default")).toBeInTheDocument();
    });
  });

  it("should successfully add a new URL", async () => {
    const user = userEvent.setup();
    mockClientApiFetch
      .mockResolvedValueOnce({ urls: [] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        urls: [
          {
            id: 1,
            stream_url: "https://twitch.tv/newcaster",
            is_default: false
          }
        ]
      });

    render(<CasterUrlSettings canManageUrls={true} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Add stream URL")).toBeInTheDocument();
    });

    const urlInput = screen.getByLabelText("Add stream URL");
    await user.type(urlInput, "https://twitch.tv/newcaster");

    const addButton = screen.getByRole("button", { name: /add url/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/accounts/caster/urls",
        {
          method: "POST",
          body: JSON.stringify({
            stream_url: "https://twitch.tv/newcaster"
          })
        }
      );
    });

    expect(mockToast.success).toHaveBeenCalledWith(
      "Stream URL added successfully!"
    );
  });

  it("should successfully delete a URL", async () => {
    const user = userEvent.setup();
    const urls = [
      {
        id: 1,
        stream_url: "https://twitch.tv/delete-me",
        is_default: false
      }
    ];
    mockClientApiFetch
      .mockResolvedValueOnce({ urls })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ urls: [] });

    render(<CasterUrlSettings canManageUrls={true} />);

    await waitFor(() => {
      expect(
        screen.getByText("https://twitch.tv/delete-me")
      ).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle("Delete URL");
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/accounts/caster/urls/1",
        { method: "DELETE" }
      );
    });

    expect(mockToast.success).toHaveBeenCalledWith(
      "Stream URL deleted successfully!"
    );
  });

  it("should validate URL format when adding", async () => {
    const user = userEvent.setup();
    mockClientApiFetch.mockResolvedValue({ urls: [] });

    render(<CasterUrlSettings canManageUrls={true} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Add stream URL")).toBeInTheDocument();
    });

    const urlInput = screen.getByLabelText("Add stream URL");
    await user.type(urlInput, "not-a-url");

    const addButton = screen.getByRole("button", { name: /add url/i });
    await user.click(addButton);

    await waitFor(() => {
      try {
        expect(
          screen.getByText("Please enter a valid URL")
        ).toBeInTheDocument();
      } catch {
        expect(mockClientApiFetch).toHaveBeenCalledTimes(1);
      }
    });
  });

  it("should handle API errors when adding", async () => {
    const user = userEvent.setup();
    const errorMessage = "Failed to add";
    mockClientApiFetch
      .mockResolvedValueOnce({ urls: [] })
      .mockRejectedValueOnce(new Error(errorMessage));

    render(<CasterUrlSettings canManageUrls={true} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Add stream URL")).toBeInTheDocument();
    });

    const urlInput = screen.getByLabelText("Add stream URL");
    await user.type(urlInput, "https://twitch.tv/testcaster");

    const addButton = screen.getByRole("button", { name: /add url/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  it("should disable Add URL button when form is pristine", async () => {
    mockClientApiFetch.mockResolvedValue({ urls: [] });

    render(<CasterUrlSettings canManageUrls={true} />);

    await waitFor(() => {
      const addButton = screen.getByRole("button", { name: /add url/i });
      expect(addButton).toBeDisabled();
    });
  });
});
