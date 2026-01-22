import { render, screen } from "@testing-library/react";
import { MatchClientDate } from "./MatchClientDate";

// Mock the date-utils module to control date formatting
jest.mock("@/lib/date-utils", () => ({
  formatDateShort: jest.fn((date: Date) => {
    // Simple mock that formats date as "MON DD, YY" in UTC
    const monthNames = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC"
    ];
    const month = monthNames[date.getUTCMonth()];
    const day = String(date.getUTCDate()).padStart(2, "0");
    const year = String(date.getUTCFullYear()).slice(-2);
    return `${month} ${day}, ${year}`;
  })
}));

describe("MatchClientDate", () => {
  it("should render formatted date", () => {
    render(
      <MatchClientDate
        startTimestamp="2024-01-15T00:00:00.000Z"
        className="test-class"
      />
    );

    const dateElement = screen.getByText(/JAN 15, 24/i);
    expect(dateElement).toBeInTheDocument();
    expect(dateElement).toHaveClass("test-class");
  });

  it("should format date with different timestamps", () => {
    render(<MatchClientDate startTimestamp="2024-01-15T14:30:00.000Z" />);

    // Date should be Jan 15 regardless of time
    expect(screen.getByText(/JAN 15, 24/i)).toBeInTheDocument();
  });

  it("should apply className prop", () => {
    render(
      <MatchClientDate
        startTimestamp="2024-01-15T00:00:00.000Z"
        className="custom-class"
      />
    );

    const dateElement = screen.getByText(/JAN 15, 24/i);
    expect(dateElement).toHaveClass("custom-class");
  });

  it("should handle different dates", () => {
    const { rerender } = render(
      <MatchClientDate startTimestamp="2024-01-15T00:00:00.000Z" />
    );

    expect(screen.getByText(/JAN 15, 24/i)).toBeInTheDocument();

    rerender(<MatchClientDate startTimestamp="2024-12-25T00:00:00.000Z" />);

    expect(screen.getByText(/DEC 25, 24/i)).toBeInTheDocument();
  });

  it("should update when startTimestamp changes", () => {
    const { rerender } = render(
      <MatchClientDate startTimestamp="2024-01-15T14:30:00.000Z" />
    );

    expect(screen.getByText(/JAN 15, 24/i)).toBeInTheDocument();

    rerender(<MatchClientDate startTimestamp="2024-01-15T18:45:00.000Z" />);

    // Same date, different time - should still show same date
    expect(screen.getByText(/JAN 15, 24/i)).toBeInTheDocument();
  });

  it("should handle year boundary dates", () => {
    render(<MatchClientDate startTimestamp="2023-12-31T23:59:59.000Z" />);

    expect(screen.getByText(/DEC 31, 23/i)).toBeInTheDocument();
  });

  it("should handle leap year dates", () => {
    render(<MatchClientDate startTimestamp="2024-02-29T00:00:00.000Z" />);

    expect(screen.getByText(/FEB 29, 24/i)).toBeInTheDocument();
  });
});
