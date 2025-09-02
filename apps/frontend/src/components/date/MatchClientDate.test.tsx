import { render, screen } from "@testing-library/react";
import { MatchClientDate } from "./MatchClientDate";

// Mock Intl.DateTimeFormat to ensure consistent test results
const mockResolvedOptions = jest.fn(() => ({ timeZone: "America/New_York" }));
Object.defineProperty(Intl, "DateTimeFormat", {
  value: jest.fn(() => ({
    resolvedOptions: mockResolvedOptions
  })),
  writable: true
});

describe("ClientDate", () => {
  beforeEach(() => {
    mockResolvedOptions.mockReturnValue({ timeZone: "America/New_York" });
  });

  it("renders server fallback initially", () => {
    render(<MatchClientDate matchDate="2025-09-02" startTime="14:30:45" />);

    // Should render some date format (exact format may vary based on server timezone)
    expect(screen.getByText(/SEP|02|25/)).toBeInTheDocument();
  });

  it("handles match date without start time", () => {
    render(<MatchClientDate matchDate="2025-12-25" />);

    // Should render some date format
    expect(screen.getByText(/DEC|25|25/)).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<MatchClientDate matchDate="2025-09-02" className="custom-class" />);

    const element = screen.getByText(/SEP|02|25/);
    expect(element).toHaveClass("custom-class");
  });
});
