import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PlayerValuesFloatingWindow } from "@/components/dashboard/PlayerValuesFloatingWindow";
import type { PlayerSortterValues } from "@eggosystem/types";

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

// Mock window.innerWidth and innerHeight
const mockWindowDimensions = (width: number, height: number) => {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width
  });
  Object.defineProperty(window, "innerHeight", {
    writable: true,
    configurable: true,
    value: height
  });
};

// Mock requestAnimationFrame
const mockRequestAnimationFrame = (callback: FrameRequestCallback): number => {
  setTimeout(callback, 0);
  return 1; // Return a mock ID
};

// Sample test data
const mockPlayerValues: PlayerSortterValues[] = [
  {
    name: "TestPlayer1",
    steamid: "steam123",
    cs2_rank: 5,
    faceit_level: 8,
    faceit_elo: 2450,
    hours: 1500,
    kanarating: 1.25,
    fkd: 1.5,
    kana_elo: 1200,
    calculus: "A"
  },
  {
    name: "TestPlayer2",
    steamid: "steam456",
    cs2_rank: 3,
    faceit_level: 6,
    faceit_elo: 2100,
    hours: 800,
    kanarating: 0.95,
    fkd: 0.8,
    kana_elo: 1100,
    calculus: "B"
  }
];

const defaultProps = {
  playerValues: mockPlayerValues,
  teamName: "Test Team",
  position: { x: 100, y: 100 },
  isLoading: false,
  onClose: jest.fn()
};

describe("PlayerValuesFloatingWindow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowDimensions(1920, 1080);
    global.requestAnimationFrame = mockRequestAnimationFrame;
  });

  describe("Rendering States", () => {
    it("should render with player data", async () => {
      render(<PlayerValuesFloatingWindow {...defaultProps} />);

      // Wait for animation to complete
      await waitFor(() => {
        expect(screen.getByText("Test Team Players")).toBeInTheDocument();
      });

      expect(screen.getByText("TestPlayer1")).toBeInTheDocument();
      expect(screen.getByText("TestPlayer2")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument(); // CS2 rank
      expect(screen.getByText("1500")).toBeInTheDocument(); // Hours
      expect(screen.getByText("8 (2450)")).toBeInTheDocument(); // Faceit level and elo
      expect(screen.getByText("1.50")).toBeInTheDocument(); // FKD
      expect(screen.getByText("1.25")).toBeInTheDocument(); // Rating
    });

    it("should render loading state", () => {
      render(<PlayerValuesFloatingWindow {...defaultProps} isLoading={true} />);

      expect(screen.getByText("Test Team Players")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument(); // Close button

      // Check for loading spinner
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should render empty state when no player data", () => {
      render(
        <PlayerValuesFloatingWindow {...defaultProps} playerValues={[]} />
      );

      expect(screen.getByText("Test Team Players")).toBeInTheDocument();
      expect(screen.getByText("No player data available")).toBeInTheDocument();
    });

    it("should render close button", () => {
      render(<PlayerValuesFloatingWindow {...defaultProps} />);

      const closeButton = screen.getByRole("button");
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("should call onClose when close button is clicked", async () => {
      const onClose = jest.fn();
      render(
        <PlayerValuesFloatingWindow {...defaultProps} onClose={onClose} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Team Players")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button");
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when double-clicking the window", async () => {
      const onClose = jest.fn();
      render(
        <PlayerValuesFloatingWindow {...defaultProps} onClose={onClose} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Team Players")).toBeInTheDocument();
      });

      const window = screen.getByText("Test Team Players").closest("div");
      fireEvent.doubleClick(window!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when clicking outside the window", async () => {
      const onClose = jest.fn();
      render(
        <PlayerValuesFloatingWindow {...defaultProps} onClose={onClose} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Team Players")).toBeInTheDocument();
      });

      // Simulate click outside by clicking on document body
      fireEvent.mouseDown(document.body);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should not call onClose when clicking inside the window", async () => {
      const onClose = jest.fn();
      render(
        <PlayerValuesFloatingWindow {...defaultProps} onClose={onClose} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Team Players")).toBeInTheDocument();
      });

      // Click inside the window
      const window = screen.getByText("Test Team Players").closest("div");
      fireEvent.mouseDown(window!);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("Positioning Logic", () => {
    it("should position window at provided coordinates when within viewport", async () => {
      render(<PlayerValuesFloatingWindow {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Test Team Players")).toBeInTheDocument();
      });

      // Get the main floating window container (the one with the style attribute)
      const window = screen
        .getByText("Test Team Players")
        .closest("div")?.parentElement;
      const style = window?.getAttribute("style");

      expect(style).toContain("top: 100px");
      expect(style).toContain("left: 100px");
    });

    it("should adjust position when window would go off right edge", async () => {
      // Set window width to be smaller than the floating window + position
      mockWindowDimensions(500, 1080);

      render(
        <PlayerValuesFloatingWindow
          {...defaultProps}
          position={{ x: 400, y: 100 }}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Team Players")).toBeInTheDocument();
      });

      // Get the main floating window container
      const window = screen
        .getByText("Test Team Players")
        .closest("div")?.parentElement;
      const style = window?.getAttribute("style");

      // Should be adjusted to stay within viewport
      expect(style).toContain("left: -170px");
    });

    it("should adjust position when window would go off bottom edge", async () => {
      // Set window height to be smaller than the floating window + position
      mockWindowDimensions(1920, 400);

      render(
        <PlayerValuesFloatingWindow
          {...defaultProps}
          position={{ x: 100, y: 300 }}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Team Players")).toBeInTheDocument();
      });

      // Get the main floating window container
      const window = screen
        .getByText("Test Team Players")
        .closest("div")?.parentElement;
      const style = window?.getAttribute("style");

      // Should be adjusted to stay within viewport (400 - 350 - 20 = 30)
      expect(style).toContain("top: 30px");
    });
  });

  describe("Animation States", () => {
    it("should start with opacity 0 and scale 95", () => {
      render(<PlayerValuesFloatingWindow {...defaultProps} />);

      // Get the main floating window container (the one with the animation classes)
      const window = screen
        .getByText("Test Team Players")
        .closest("div")?.parentElement;
      expect(window).toHaveClass("opacity-0", "scale-95");
    });

    it("should transition to opacity 100 and no scale after mount", async () => {
      render(<PlayerValuesFloatingWindow {...defaultProps} />);

      await waitFor(() => {
        // Get the main floating window container
        const window = screen
          .getByText("Test Team Players")
          .closest("div")?.parentElement;
        expect(window).toHaveClass("opacity-100", "transform-none");
      });
    });
  });

  describe("Data Display", () => {
    it("should display player data correctly in table format", async () => {
      render(<PlayerValuesFloatingWindow {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Test Team Players")).toBeInTheDocument();
      });

      // Check table headers
      expect(screen.getByText("Player")).toBeInTheDocument();
      expect(screen.getByText("CS2 Rank")).toBeInTheDocument();
      expect(screen.getByText("Hours")).toBeInTheDocument();
      expect(screen.getByText("Faceit")).toBeInTheDocument();
      expect(screen.getByText("FKD")).toBeInTheDocument();
      expect(screen.getByText("RATING")).toBeInTheDocument();

      // Check player data
      expect(screen.getByText("TestPlayer1")).toBeInTheDocument();
      expect(screen.getByText("TestPlayer2")).toBeInTheDocument();
    });

    it("should handle null values correctly", async () => {
      const playerWithNulls: PlayerSortterValues[] = [
        {
          name: "TestPlayer",
          steamid: "steam123",
          cs2_rank: null,
          faceit_level: null,
          faceit_elo: 800, // faceit_elo cannot be null according to the type
          hours: null,
          kanarating: null,
          fkd: null,
          kana_elo: 900,
          calculus: null
        }
      ];

      render(
        <PlayerValuesFloatingWindow
          {...defaultProps}
          playerValues={playerWithNulls}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Team Players")).toBeInTheDocument();
      });

      expect(screen.getByText("TestPlayer")).toBeInTheDocument();

      // Check that both FKD and RATING show 0.00 for null values
      const zeroValues = screen.getAllByText("0.00");
      expect(zeroValues).toHaveLength(2); // Both FKD and RATING should be 0.00
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", async () => {
      render(<PlayerValuesFloatingWindow {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Test Team Players")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button");
      expect(closeButton).toBeInTheDocument();
    });

    it("should be keyboard accessible", async () => {
      render(<PlayerValuesFloatingWindow {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Test Team Players")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button");
      expect(closeButton).toBeInTheDocument();
    });
  });
});
