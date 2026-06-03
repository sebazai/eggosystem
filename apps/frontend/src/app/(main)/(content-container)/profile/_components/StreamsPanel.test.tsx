import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StreamsPanel } from "./StreamsPanel";
import { clientApiFetch } from "@/lib/apiClient";
import { toast } from "sonner";

jest.mock("@/lib/apiClient");
jest.mock("sonner");

const mockClientApiFetch = clientApiFetch as jest.MockedFunction<
  typeof clientApiFetch
>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe("StreamsPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Stream URLs card for all users", () => {
    render(<StreamsPanel canManageUrls={false} />);
    expect(screen.getByText("Stream URLs")).toBeInTheDocument();
  });

  it("shows non-caster message when canManageUrls is false", () => {
    render(<StreamsPanel canManageUrls={false} />);
    expect(
      screen.getByText(
        /stream url management is available to users with the caster role/i
      )
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Add Stream URL")).not.toBeInTheDocument();
  });

  it("shows the add form and loads URLs for casters", async () => {
    mockClientApiFetch.mockResolvedValue({ urls: [] });
    render(<StreamsPanel canManageUrls={true} />);
    await waitFor(() => {
      expect(screen.getByLabelText("Add Stream URL")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /add url/i })
      ).toBeInTheDocument();
    });
    expect(mockClientApiFetch).toHaveBeenCalledWith(
      "/api/v1/accounts/caster/urls"
    );
  });

  it("displays existing URLs with a default badge", async () => {
    mockClientApiFetch.mockResolvedValue({
      urls: [
        { id: 1, stream_url: "https://twitch.tv/caster1", is_default: true },
        { id: 2, stream_url: "https://youtube.com/caster2", is_default: false }
      ]
    });
    render(<StreamsPanel canManageUrls={true} />);
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

  it("adds a new URL and shows success toast", async () => {
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

    render(<StreamsPanel canManageUrls={true} />);
    await waitFor(() =>
      expect(screen.getByLabelText("Add Stream URL")).toBeInTheDocument()
    );

    await user.type(
      screen.getByLabelText("Add Stream URL"),
      "https://twitch.tv/newcaster"
    );
    await user.click(screen.getByRole("button", { name: /add url/i }));

    await waitFor(() => {
      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/accounts/caster/urls",
        {
          method: "POST",
          body: JSON.stringify({ stream_url: "https://twitch.tv/newcaster" })
        }
      );
      expect(mockToast.success).toHaveBeenCalledWith(
        "Stream URL added successfully."
      );
    });
  });

  it("deletes a URL and shows success toast", async () => {
    const user = userEvent.setup();
    mockClientApiFetch
      .mockResolvedValueOnce({
        urls: [
          {
            id: 1,
            stream_url: "https://twitch.tv/remove-me",
            is_default: false
          }
        ]
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ urls: [] });

    render(<StreamsPanel canManageUrls={true} />);
    await waitFor(() =>
      expect(
        screen.getByText("https://twitch.tv/remove-me")
      ).toBeInTheDocument()
    );

    await user.click(
      screen.getByRole("button", {
        name: /delete https:\/\/twitch\.tv\/remove-me/i
      })
    );

    await waitFor(() => {
      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/accounts/caster/urls/1",
        { method: "DELETE" }
      );
      expect(mockToast.success).toHaveBeenCalledWith("Stream URL removed.");
    });
  });

  it("sets a URL as default and updates optimistically", async () => {
    const user = userEvent.setup();
    mockClientApiFetch
      .mockResolvedValueOnce({
        urls: [
          { id: 1, stream_url: "https://twitch.tv/a", is_default: false },
          { id: 2, stream_url: "https://twitch.tv/b", is_default: false }
        ]
      })
      .mockResolvedValueOnce({});

    render(<StreamsPanel canManageUrls={true} />);
    await waitFor(() =>
      expect(screen.getByText("https://twitch.tv/a")).toBeInTheDocument()
    );

    await user.click(
      screen.getByRole("button", {
        name: /set https:\/\/twitch\.tv\/a as default/i
      })
    );

    await waitFor(() => {
      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/accounts/caster/urls/1/default",
        { method: "PATCH" }
      );
      expect(mockToast.success).toHaveBeenCalledWith(
        "Default stream URL updated."
      );
    });
    // Only initial load + PATCH — no extra reload on optimistic update
    expect(mockClientApiFetch).toHaveBeenCalledTimes(2);
  });

  it("clears the default URL and updates optimistically", async () => {
    const user = userEvent.setup();
    mockClientApiFetch
      .mockResolvedValueOnce({
        urls: [{ id: 1, stream_url: "https://twitch.tv/a", is_default: true }]
      })
      .mockResolvedValueOnce({});

    render(<StreamsPanel canManageUrls={true} />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /clear default/i })
      ).toBeInTheDocument()
    );

    await user.click(screen.getByRole("button", { name: /clear default/i }));

    await waitFor(() => {
      expect(mockClientApiFetch).toHaveBeenCalledWith(
        "/api/v1/accounts/caster/default-url",
        { method: "DELETE" }
      );
      expect(mockToast.success).toHaveBeenCalledWith("Default cleared.");
    });
    // Only initial load + DELETE — no extra reload on optimistic update
    expect(mockClientApiFetch).toHaveBeenCalledTimes(2);
  });

  it("rejects invalid URL and does not call the API", async () => {
    const user = userEvent.setup();
    mockClientApiFetch.mockResolvedValue({ urls: [] });

    render(<StreamsPanel canManageUrls={true} />);
    await waitFor(() =>
      expect(screen.getByLabelText("Add Stream URL")).toBeInTheDocument()
    );

    await user.type(screen.getByLabelText("Add Stream URL"), "not-a-valid-url");
    await user.click(screen.getByRole("button", { name: /add url/i }));

    await waitFor(() => {
      // Only the initial load should have been called, not a POST
      expect(mockClientApiFetch).toHaveBeenCalledTimes(1);
    });
  });

  it("shows error toast when add URL fails", async () => {
    const user = userEvent.setup();
    mockClientApiFetch
      .mockResolvedValueOnce({ urls: [] })
      .mockRejectedValueOnce(new Error("Server error"));

    render(<StreamsPanel canManageUrls={true} />);
    await waitFor(() =>
      expect(screen.getByLabelText("Add Stream URL")).toBeInTheDocument()
    );

    await user.type(
      screen.getByLabelText("Add Stream URL"),
      "https://twitch.tv/test"
    );
    await user.click(screen.getByRole("button", { name: /add url/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Server error");
    });
  });

  it("keeps Add button disabled when the URL input is untouched", async () => {
    mockClientApiFetch.mockResolvedValue({ urls: [] });
    render(<StreamsPanel canManageUrls={true} />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add url/i })).toBeDisabled();
    });
  });
});
