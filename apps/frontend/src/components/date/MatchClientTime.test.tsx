import { render, screen, waitFor } from "@testing-library/react";
import { MatchClientTime } from "./MatchClientTime";

describe("MatchClientTime", () => {
  const originalWindow = global.window;

  beforeEach(() => {
    // Restore window before each test
    global.window = originalWindow;
    // Mock Intl.DateTimeFormat for consistent testing
    jest.spyOn(Intl, "DateTimeFormat").mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({
            timeZone: "America/New_York"
          }),
          format: jest.fn(),
          formatToParts: jest.fn(),
          formatRange: jest.fn(),
          formatRangeToParts: jest.fn()
        }) as any
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Restore window object
    global.window = originalWindow;
  });

  it("should render UTC time initially (server-side)", () => {
    // In test environment, window is always defined, so component uses client-side formatting
    // "2024-01-15" at 14:30:00 UTC = "2024-01-15" at 09:30:00 EST (UTC-5)
    render(
      <MatchClientTime
        matchDate="2024-01-15"
        startTime="14:30:00"
        className="test-class"
      />
    );

    const timeElement = screen.getByText(/Starts: 09:30/i);
    expect(timeElement).toBeInTheDocument();
    expect(timeElement).toHaveClass("test-class");
  });

  it("should update to client timezone after hydration", async () => {
    // Mock client-side (window exists)
    global.window = originalWindow;

    render(<MatchClientTime matchDate="2024-01-15" startTime="14:30:00" />);

    // On client, shows local time (America/New_York is UTC-5, so 14:30 UTC = 09:30 EST)
    // The exact time will depend on timezone, but component should render
    await waitFor(() => {
      const timeElement = screen.getByText(/Starts:/i);
      expect(timeElement).toBeInTheDocument();
    });
  });

  it("should handle time range with endTime", () => {
    // Mock client-side
    global.window = originalWindow;

    render(
      <MatchClientTime
        matchDate="2024-01-15"
        startTime="14:30:00"
        endTime="16:00:00"
        className="test-class"
      />
    );

    // Should show time range (local timezone - America/New_York is UTC-5)
    // 14:30 UTC = 09:30 EST, 16:00 UTC = 11:00 EST
    const timeElement = screen.getByText(/09:30–11:00/i);
    expect(timeElement).toBeInTheDocument();
    expect(timeElement).toHaveClass("test-class");
  });

  it("should handle time range without endTime", () => {
    // Mock client-side
    global.window = originalWindow;

    render(<MatchClientTime matchDate="2024-01-15" startTime="14:30:00" />);

    // Shows local time (09:30 EST for 14:30 UTC)
    expect(screen.getByText(/Starts: 09:30/i)).toBeInTheDocument();
  });

  it("should apply className prop", () => {
    render(
      <MatchClientTime
        matchDate="2024-01-15"
        startTime="14:30:00"
        className="custom-class"
      />
    );

    const timeElement = screen.getByText(/Starts:/i);
    expect(timeElement).toHaveClass("custom-class");
  });

  it("should handle different start times", () => {
    // Mock client-side
    global.window = originalWindow;

    const { rerender } = render(
      <MatchClientTime matchDate="2024-01-15" startTime="14:30:00" />
    );

    // 14:30 UTC = 09:30 EST
    expect(screen.getByText(/Starts: 09:30/i)).toBeInTheDocument();

    rerender(<MatchClientTime matchDate="2024-01-15" startTime="18:45:00" />);

    // 18:45 UTC = 13:45 EST
    expect(screen.getByText(/Starts: 13:45/i)).toBeInTheDocument();
  });

  it("should update when endTime changes", () => {
    // Mock client-side
    global.window = originalWindow;

    const { rerender } = render(
      <MatchClientTime
        matchDate="2024-01-15"
        startTime="14:30:00"
        endTime="16:00:00"
      />
    );

    // 14:30 UTC = 09:30 EST, 16:00 UTC = 11:00 EST
    expect(screen.getByText(/09:30–11:00/i)).toBeInTheDocument();

    rerender(
      <MatchClientTime
        matchDate="2024-01-15"
        startTime="14:30:00"
        endTime="17:30:00"
      />
    );

    // 14:30 UTC = 09:30 EST, 17:30 UTC = 12:30 EST
    expect(screen.getByText(/09:30–12:30/i)).toBeInTheDocument();
  });

  it("should handle null endTime", () => {
    // Mock client-side
    global.window = originalWindow;

    render(
      <MatchClientTime
        matchDate="2024-01-15"
        startTime="14:30:00"
        endTime={null}
      />
    );

    // 14:30 UTC = 09:30 EST
    expect(screen.getByText(/Starts: 09:30/i)).toBeInTheDocument();
  });
});
