import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountsPanel } from "./AccountsPanel";
import { clientApiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
import { useFaceitPlayerData } from "@/hooks/data/useFaceitPlayerData";
import { useSteamPlayer } from "@/hooks/data/useSteamPlayer";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn()
}));
jest.mock("@/lib/apiClient");
jest.mock("sonner");
jest.mock("@/hooks/data/useFaceitPlayerData");
jest.mock("@/hooks/data/useSteamPlayer");
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: { src: string; alt: string }) => <span>{alt}</span>
}));

const mockClientApiFetch = clientApiFetch as jest.MockedFunction<
  typeof clientApiFetch
>;
const mockToast = toast as jest.Mocked<typeof toast>;
const mockUseFaceitPlayerData = useFaceitPlayerData as jest.MockedFunction<
  typeof useFaceitPlayerData
>;
const mockUseSteamPlayer = useSteamPlayer as jest.MockedFunction<
  typeof useSteamPlayer
>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

const mockCheckAuth = jest.fn();
let mockPush: jest.Mock;

const baseUser = {
  provider_id: "76561198000000001",
  discordLinked: false
} as any;

describe("AccountsPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush = jest.fn();
    mockUseRouter.mockReturnValue({ push: mockPush } as any);
    mockUseFaceitPlayerData.mockReturnValue({
      faceitPlayerData: undefined,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
    mockUseSteamPlayer.mockReturnValue({
      steamPlayer: undefined,
      isLoading: false,
      isError: undefined,
      isValidating: false
    });
  });

  describe("Discord", () => {
    it("shows not-connected status when Discord is not linked", () => {
      render(
        <AccountsPanel
          user={{ ...baseUser, discordLinked: false }}
          checkAuth={mockCheckAuth}
        />
      );
      expect(screen.getByText("Not connected")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /link discord/i })
      ).toBeInTheDocument();
    });

    it("shows connected status when Discord is linked", () => {
      render(
        <AccountsPanel
          user={{ ...baseUser, discordLinked: true }}
          checkAuth={mockCheckAuth}
        />
      );
      expect(screen.getByText("Connected via OAuth")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /unlink discord/i })
      ).toBeInTheDocument();
    });

    it("navigates to Discord OAuth on link click", async () => {
      const user = userEvent.setup();
      render(
        <AccountsPanel
          user={{ ...baseUser, discordLinked: false }}
          checkAuth={mockCheckAuth}
        />
      );

      await user.click(screen.getByRole("button", { name: /link discord/i }));

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/auth/discord/login?returnTo=profile")
      );
    });

    it("opens confirmation modal when unlink is clicked", async () => {
      const user = userEvent.setup();
      render(
        <AccountsPanel
          user={{ ...baseUser, discordLinked: true }}
          checkAuth={mockCheckAuth}
        />
      );

      await user.click(screen.getByRole("button", { name: /unlink discord/i }));

      await waitFor(() => {
        expect(screen.getByText("Unlink Discord Account")).toBeInTheDocument();
      });
    });

    it("calls unlink API and refreshes auth on confirm", async () => {
      const user = userEvent.setup();
      mockClientApiFetch.mockResolvedValue({ message: "Unlinked" });

      render(
        <AccountsPanel
          user={{ ...baseUser, discordLinked: true }}
          checkAuth={mockCheckAuth}
        />
      );

      await user.click(screen.getByRole("button", { name: /unlink discord/i }));
      await waitFor(() =>
        expect(screen.getByText("Unlink Discord Account")).toBeInTheDocument()
      );

      await user.click(screen.getByRole("button", { name: /^unlink$/i }));

      await waitFor(() => {
        expect(mockClientApiFetch).toHaveBeenCalledWith(
          "/api/v1/discord/unlink",
          { method: "DELETE" }
        );
        expect(mockCheckAuth).toHaveBeenCalled();
        expect(mockToast.success).toHaveBeenCalledWith(
          "Discord account unlinked successfully"
        );
      });
    });

    it("shows error toast when unlink API fails", async () => {
      const user = userEvent.setup();
      mockClientApiFetch.mockRejectedValue(new Error("Network error"));

      render(
        <AccountsPanel
          user={{ ...baseUser, discordLinked: true }}
          checkAuth={mockCheckAuth}
        />
      );

      await user.click(screen.getByRole("button", { name: /unlink discord/i }));
      await waitFor(() =>
        expect(screen.getByText("Unlink Discord Account")).toBeInTheDocument()
      );

      await user.click(screen.getByRole("button", { name: /^unlink$/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          expect.stringContaining("Network error")
        );
      });
    });
  });

  describe("Steam account", () => {
    it("displays Steam ID in the status row", () => {
      render(<AccountsPanel user={baseUser} checkAuth={mockCheckAuth} />);
      expect(
        screen.getByText(`Steam ID · ${baseUser.provider_id}`)
      ).toBeInTheDocument();
    });

    it("does not render a link/unlink button for Steam", () => {
      render(<AccountsPanel user={baseUser} checkAuth={mockCheckAuth} />);
      expect(
        screen.queryByRole("button", { name: /link steam/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /unlink steam/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Faceit account", () => {
    it("shows Not linked status text when no Faceit data", () => {
      render(<AccountsPanel user={baseUser} checkAuth={mockCheckAuth} />);
      // "Not linked" appears in both the badge and the status <p> inside the Faceit row;
      // assert at least one is present
      expect(screen.getAllByText("Not linked").length).toBeGreaterThanOrEqual(
        1
      );
      // Verify the Faceit row renders without a profile link (no data = no href)
      expect(
        screen.queryByRole("link", { name: /view faceit profile/i })
      ).not.toBeInTheDocument();
    });

    it("shows ELO and nickname when Faceit data is available", () => {
      mockUseSteamPlayer.mockReturnValue({
        steamPlayer: { faceit_nickname: "pro_player" } as any,
        isLoading: false,
        isError: undefined,
        isValidating: false
      });
      mockUseFaceitPlayerData.mockReturnValue({
        faceitPlayerData: {
          player_id: "abc123",
          elo: 2400,
          faceit_url: "https://faceit.com/en/players/pro_player"
        } as any,
        isLoading: false,
        isError: undefined,
        isValidating: false
      });

      render(<AccountsPanel user={baseUser} checkAuth={mockCheckAuth} />);

      expect(screen.getByText("pro_player · ELO 2400")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /view faceit profile/i })
      ).toBeInTheDocument();
    });

    it("falls back to player_id when faceit_nickname is absent", () => {
      mockUseSteamPlayer.mockReturnValue({
        steamPlayer: { faceit_nickname: undefined } as any,
        isLoading: false,
        isError: undefined,
        isValidating: false
      });
      mockUseFaceitPlayerData.mockReturnValue({
        faceitPlayerData: {
          player_id: "abc123",
          elo: 1800,
          faceit_url: "https://faceit.com/en/players/abc123"
        } as any,
        isLoading: false,
        isError: undefined,
        isValidating: false
      });

      render(<AccountsPanel user={baseUser} checkAuth={mockCheckAuth} />);

      expect(screen.getByText("abc123 · ELO 1800")).toBeInTheDocument();
    });
  });
});
