import { render, screen } from "@testing-library/react";
import { DivisionPill } from "./DivisionPill";
import { SeasonChip } from "./SeasonChip";
import { MetaPill } from "./MetaPill";
import { MapScoreChip } from "./MapScoreChip";
import { DateGroup } from "./DateGroup";
import { Swords } from "lucide-react";

describe("DivisionPill", () => {
  it.each([
    ["premier", "Masters"],
    ["elite", "Challengers"],
    ["challenge", "Prospects"],
    ["open", "Open"]
  ] as const)("renders label for %s tier", (tierKey, expectedLabel) => {
    render(<DivisionPill tierKey={tierKey} />);
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  it("applies tier color via inline style", () => {
    const { container } = render(<DivisionPill tierKey="premier" />);
    const pill = container.firstChild as HTMLElement;
    expect(pill.style.color).toContain("--tier-premier");
  });
});

describe("SeasonChip", () => {
  it("renders the label", () => {
    render(<SeasonChip label="S5" />);
    expect(screen.getByText("S5")).toBeInTheDocument();
  });

  it("applies light-brown styling", () => {
    const { container } = render(<SeasonChip label="S4" />);
    const chip = container.firstChild as HTMLElement;
    expect(chip.className).toContain("kanaliiga-light-brown");
  });
});

describe("MetaPill", () => {
  it("renders the label", () => {
    render(<MetaPill icon={Swords} label="Bo3" />);
    expect(screen.getByText("Bo3")).toBeInTheDocument();
  });

  it("renders an svg icon", () => {
    const { container } = render(<MetaPill icon={Swords} label="Bo3" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

describe("MapScoreChip", () => {
  const map = { name: "de_nuke", score_a: 13, score_b: 9 };

  it("renders map name and scores", () => {
    render(<MapScoreChip map={map} winner="a" />);
    expect(screen.getByText("de_nuke")).toBeInTheDocument();
    expect(screen.getByText("13")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("bolds the winning side score", () => {
    const { container } = render(<MapScoreChip map={map} winner="a" />);
    const scores = container.querySelectorAll("span > span");
    const aScore = Array.from(scores).find((el) => el.textContent === "13");
    const bScore = Array.from(scores).find((el) => el.textContent === "9");
    expect(aScore?.className).toContain("font-bold");
    expect(bScore?.className).not.toContain("font-bold");
  });

  it("marks both sides as muted on draw", () => {
    const drawMap = { name: "de_mirage", score_a: 13, score_b: 13 };
    const { container } = render(<MapScoreChip map={drawMap} winner="draw" />);
    const spans = container.querySelectorAll("span > span");
    const scored = Array.from(spans).filter((el) =>
      ["13"].includes(el.textContent ?? "")
    );
    scored.forEach((el) => {
      expect(el.className).toContain("muted");
    });
  });
});

describe("DateGroup", () => {
  it("formats the date heading correctly", () => {
    render(
      <DateGroup date="2026-05-23" count={3}>
        <div>child</div>
      </DateGroup>
    );
    expect(screen.getByText(/MAY 23 · 2026/)).toBeInTheDocument();
  });

  it("shows singular 'match' for count 1", () => {
    render(
      <DateGroup date="2026-05-01" count={1}>
        <div />
      </DateGroup>
    );
    expect(screen.getByText("1 match")).toBeInTheDocument();
  });

  it("shows plural 'matches' for count > 1", () => {
    render(
      <DateGroup date="2026-05-01" count={4}>
        <div />
      </DateGroup>
    );
    expect(screen.getByText("4 matches")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <DateGroup date="2026-05-01" count={1}>
        <span data-testid="child">hello</span>
      </DateGroup>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
