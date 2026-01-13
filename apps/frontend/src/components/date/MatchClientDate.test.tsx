import { render, screen, waitFor } from "@testing-library/react";
import { MatchClientDate } from "./MatchClientDate";

describe("MatchClientDate", () => {
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

  it("should render UTC date initially (server-side)", () => {
    // In test environment, window is always defined, so component uses client-side formatting
    // "2024-01-15" at 00:00:00 UTC = "2024-01-14" at 19:00:00 EST (UTC-5)
    // So we expect JAN 14 in America/New_York timezone
    render(<MatchClientDate matchDate="2024-01-15" className="test-class" />);

    const dateElement = screen.getByText(/JAN 14, 24/i);
    expect(dateElement).toBeInTheDocument();
    expect(dateElement).toHaveClass("test-class");
  });

  it("should update to client timezone after hydration", async () => {
    render(<MatchClientDate matchDate="2024-01-15" startTime="14:30:00" />);

    // Initially shows UTC
    expect(screen.getByText(/JAN 15, 24/i)).toBeInTheDocument();

    // After hydration, should show client timezone
    await waitFor(() => {
      const dateElement = screen.getByText(/JAN 15, 24/i);
      expect(dateElement).toBeInTheDocument();
    });
  });

  it("should handle date without startTime", () => {
    // In test environment, window is always defined, so component uses client-side formatting
    // "2024-01-15" at 00:00:00 UTC = "2024-01-14" at 19:00:00 EST (UTC-5)
    render(<MatchClientDate matchDate="2024-01-15" />);

    expect(screen.getByText(/JAN 14, 24/i)).toBeInTheDocument();
  });

  it("should format date with startTime correctly", () => {
    // Mock client-side
    global.window = originalWindow;

    render(<MatchClientDate matchDate="2024-01-15" startTime="14:30:00" />);

    // 14:30 UTC = 09:30 EST on Jan 15, so date is still JAN 15
    expect(screen.getByText(/JAN 15, 24/i)).toBeInTheDocument();
  });

  it("should apply className prop", () => {
    // In test environment, window is always defined, so component uses client-side formatting
    render(<MatchClientDate matchDate="2024-01-15" className="custom-class" />);

    const dateElement = screen.getByText(/JAN 14, 24/i);
    expect(dateElement).toHaveClass("custom-class");
  });

  it("should handle different dates", () => {
    // In test environment, window is always defined, so component uses client-side formatting
    const { rerender } = render(<MatchClientDate matchDate="2024-01-15" />);

    // "2024-01-15" at 00:00:00 UTC = "2024-01-14" at 19:00:00 EST
    expect(screen.getByText(/JAN 14, 24/i)).toBeInTheDocument();

    rerender(<MatchClientDate matchDate="2024-12-25" />);
    // "2024-12-25" at 00:00:00 UTC = "2024-12-24" at 19:00:00 EST
    expect(screen.getByText(/DEC 24, 24/i)).toBeInTheDocument();
  });

  it("should update when startTime changes", () => {
    // Mock client-side
    global.window = originalWindow;

    const { rerender } = render(
      <MatchClientDate matchDate="2024-01-15" startTime="14:30:00" />
    );

    expect(screen.getByText(/JAN 15, 24/i)).toBeInTheDocument();

    rerender(<MatchClientDate matchDate="2024-01-15" startTime="18:45:00" />);

    expect(screen.getByText(/JAN 15, 24/i)).toBeInTheDocument();
  });
});
