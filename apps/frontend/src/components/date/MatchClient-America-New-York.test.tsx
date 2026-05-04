import { render, screen } from "@testing-library/react";
import { MatchClientDate } from "./MatchClientDate";
import { MatchClientTime } from "./MatchClientTime";

describe("MatchClient date/time with resolved IANA zone America/New_York", () => {
  beforeEach(() => {
    const base = new Intl.DateTimeFormat().resolvedOptions();
    jest
      .spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions")
      .mockReturnValue({
        ...base,
        timeZone: "America/New_York"
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("MatchClientDate: local calendar day differs from UTC and datetime stays ISO UTC", () => {
    render(<MatchClientDate startTimestamp="2024-01-15T00:00:00.000Z" />);

    const el = screen.getByRole("time", { name: /JAN 14, 24/i });
    expect(el).toHaveAttribute("datetime", "2024-01-15T00:00:00.000Z");
    expect(el.getAttribute("title")).toContain("15 Jan 2024 00:00:00 GMT");
  });

  it("MatchClientDate: evening UTC instant maps to local same calendar day", () => {
    render(<MatchClientDate startTimestamp="2024-01-15T14:30:00.000Z" />);

    const el = screen.getByRole("time", { name: /JAN 15, 24/i });
    expect(el).toHaveAttribute("datetime", "2024-01-15T14:30:00.000Z");
    expect(el.getAttribute("title")).toMatch(/^UTC:/);
  });

  it("MatchClientTime: wall clock is Eastern for a UTC instant; datetime/title carry UTC", () => {
    render(<MatchClientTime startTimestamp="2024-01-15T14:30:00.000Z" />);

    const clock = screen.getByRole("time", { name: "09:30" });
    expect(clock.closest("span")).toHaveTextContent("Starts: 09:30");
    expect(clock).toHaveAttribute("datetime", "2024-01-15T14:30:00.000Z");
    expect(clock.getAttribute("title")).toContain("15 Jan 2024 14:30:00 GMT");
  });

  it("MatchClientTime: local range with per-instant UTC metadata", () => {
    render(
      <MatchClientTime
        startTimestamp="2024-01-15T14:30:00.000Z"
        endTimestamp="2024-01-15T16:00:00.000Z"
      />
    );

    expect(
      screen.getByRole("time", { name: "09:30" }).closest("span")
    ).toHaveTextContent("09:30–11:00");
    const clocks = screen.getAllByRole("time");
    if (clocks.length < 2) {
      throw new Error("expected 2 <time> elements");
    }
    const startClock = clocks[0];
    const endClock = clocks[1];
    if (startClock === undefined || endClock === undefined) {
      throw new Error("expected 2 <time> elements");
    }
    expect(startClock).toHaveAttribute("datetime", "2024-01-15T14:30:00.000Z");
    expect(endClock).toHaveAttribute("datetime", "2024-01-15T16:00:00.000Z");
    expect(startClock.getAttribute("title")).toContain(
      "15 Jan 2024 14:30:00 GMT"
    );
    expect(endClock.getAttribute("title")).toContain(
      "15 Jan 2024 16:00:00 GMT"
    );
  });
});
