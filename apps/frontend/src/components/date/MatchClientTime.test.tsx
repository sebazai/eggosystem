import { render, screen } from "@testing-library/react";
import { MatchClientTime } from "./MatchClientTime";

function restoreProcessTz(previous: string | undefined) {
  if (previous === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = previous;
  }
}

describe("MatchClientTime", () => {
  const previousTz = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = "UTC";
  });

  afterAll(() => {
    restoreProcessTz(previousTz);
  });

  it("should render local time with startTimestamp only", () => {
    render(
      <MatchClientTime
        startTimestamp="2024-01-15T14:30:00.000Z"
        className="test-class"
      />
    );

    const clock = screen.getByRole("time", { name: "14:30" });
    const row = clock.closest("span");
    expect(row).toHaveTextContent("Starts: 14:30");
    expect(row).toHaveClass("test-class");
    expect(clock).toHaveAttribute("datetime", "2024-01-15T14:30:00.000Z");
    expect(clock.getAttribute("title")).toMatch(/^UTC:/);
  });

  it("should handle time range with endTimestamp", () => {
    render(
      <MatchClientTime
        startTimestamp="2024-01-15T14:30:00.000Z"
        endTimestamp="2024-01-15T16:00:00.000Z"
        className="test-class"
      />
    );

    // Local range matches UTC when TZ=UTC: 14:30–16:00
    const clocks = screen.getAllByRole("time");
    if (clocks.length < 2) {
      throw new Error("expected 2 <time> elements");
    }
    const startClock = clocks[0];
    const endClock = clocks[1];
    if (startClock === undefined || endClock === undefined) {
      throw new Error("expected 2 <time> elements");
    }
    const row = startClock.closest("span");
    expect(row).toHaveTextContent("14:30–16:00");
    expect(row).toHaveClass("test-class");
    expect(startClock).toHaveAttribute("datetime", "2024-01-15T14:30:00.000Z");
    expect(endClock).toHaveAttribute("datetime", "2024-01-15T16:00:00.000Z");
    expect(startClock.getAttribute("title")).toMatch(/^UTC:/);
    expect(endClock.getAttribute("title")).toMatch(/^UTC:/);
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

    expect(
      screen.getByRole("time", { name: "14:30" }).closest("span")
    ).toHaveTextContent("Starts: 14:30");

    rerender(<MatchClientTime startTimestamp="2024-01-15T18:45:00.000Z" />);

    expect(
      screen.getByRole("time", { name: "18:45" }).closest("span")
    ).toHaveTextContent("Starts: 18:45");
  });

  it("should update when endTimestamp changes", () => {
    const { rerender } = render(
      <MatchClientTime
        startTimestamp="2024-01-15T14:30:00.000Z"
        endTimestamp="2024-01-15T16:00:00.000Z"
      />
    );

    expect(
      screen.getByRole("time", { name: "14:30" }).closest("span")
    ).toHaveTextContent("14:30–16:00");

    rerender(
      <MatchClientTime
        startTimestamp="2024-01-15T14:30:00.000Z"
        endTimestamp="2024-01-15T17:30:00.000Z"
      />
    );

    expect(
      screen.getByRole("time", { name: "14:30" }).closest("span")
    ).toHaveTextContent("14:30–17:30");
  });

  it("should handle null endTimestamp", () => {
    render(
      <MatchClientTime
        startTimestamp="2024-01-15T14:30:00.000Z"
        endTimestamp={null}
      />
    );

    expect(
      screen.getByRole("time", { name: "14:30" }).closest("span")
    ).toHaveTextContent("Starts: 14:30");
  });

  it("should format midnight correctly", () => {
    render(<MatchClientTime startTimestamp="2024-01-15T00:00:00.000Z" />);

    expect(
      screen.getByRole("time", { name: "00:00" }).closest("span")
    ).toHaveTextContent("Starts: 00:00");
  });

  it("should format late evening times correctly", () => {
    render(<MatchClientTime startTimestamp="2024-01-15T23:59:00.000Z" />);

    expect(
      screen.getByRole("time", { name: "23:59" }).closest("span")
    ).toHaveTextContent("Starts: 23:59");
  });
});
