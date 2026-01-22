import { render, screen } from "@testing-library/react";
import { MatchClientTime } from "./MatchClientTime";

describe("MatchClientTime", () => {
  it("should render UTC time with startTimestamp only", () => {
    render(
      <MatchClientTime
        startTimestamp="2024-01-15T14:30:00.000Z"
        className="test-class"
      />
    );

    const timeElement = screen.getByText(/Starts: 14:30/i);
    expect(timeElement).toBeInTheDocument();
    expect(timeElement).toHaveClass("test-class");
  });

  it("should handle time range with endTimestamp", () => {
    render(
      <MatchClientTime
        startTimestamp="2024-01-15T14:30:00.000Z"
        endTimestamp="2024-01-15T16:00:00.000Z"
        className="test-class"
      />
    );

    // Should show UTC time range: 14:30–16:00
    const timeElement = screen.getByText(/14:30–16:00/i);
    expect(timeElement).toBeInTheDocument();
    expect(timeElement).toHaveClass("test-class");
  });

  it("should apply className prop", () => {
    render(
      <MatchClientTime
        startTimestamp="2024-01-15T14:30:00.000Z"
        className="custom-class"
      />
    );

    const timeElement = screen.getByText(/Starts:/i);
    expect(timeElement).toHaveClass("custom-class");
  });

  it("should handle different start times", () => {
    const { rerender } = render(
      <MatchClientTime startTimestamp="2024-01-15T14:30:00.000Z" />
    );

    expect(screen.getByText(/Starts: 14:30/i)).toBeInTheDocument();

    rerender(<MatchClientTime startTimestamp="2024-01-15T18:45:00.000Z" />);

    expect(screen.getByText(/Starts: 18:45/i)).toBeInTheDocument();
  });

  it("should update when endTimestamp changes", () => {
    const { rerender } = render(
      <MatchClientTime
        startTimestamp="2024-01-15T14:30:00.000Z"
        endTimestamp="2024-01-15T16:00:00.000Z"
      />
    );

    expect(screen.getByText(/14:30–16:00/i)).toBeInTheDocument();

    rerender(
      <MatchClientTime
        startTimestamp="2024-01-15T14:30:00.000Z"
        endTimestamp="2024-01-15T17:30:00.000Z"
      />
    );

    expect(screen.getByText(/14:30–17:30/i)).toBeInTheDocument();
  });

  it("should handle null endTimestamp", () => {
    render(
      <MatchClientTime
        startTimestamp="2024-01-15T14:30:00.000Z"
        endTimestamp={null}
      />
    );

    expect(screen.getByText(/Starts: 14:30/i)).toBeInTheDocument();
  });

  it("should format midnight correctly", () => {
    render(<MatchClientTime startTimestamp="2024-01-15T00:00:00.000Z" />);

    expect(screen.getByText(/Starts: 00:00/i)).toBeInTheDocument();
  });

  it("should format late evening times correctly", () => {
    render(<MatchClientTime startTimestamp="2024-01-15T23:59:00.000Z" />);

    expect(screen.getByText(/Starts: 23:59/i)).toBeInTheDocument();
  });
});
