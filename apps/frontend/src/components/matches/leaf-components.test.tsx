import { render, screen } from "@testing-library/react";
import { DivisionPill } from "./DivisionPill";
import { SeasonChip } from "./SeasonChip";
import { MetaPill } from "./MetaPill";
import { MapScoreChip } from "./MapScoreChip";
import { DateGroup } from "./DateGroup";
import { Swords } from "lucide-react";

describe("DivisionPill", () => {
  it.each([
    ["Masters", "Masters"],
    ["Challengers", "Challengers"],
    ["Prospects", "Prospects"],
    ["div5", "Div 5"],
    ["div2", "Div 2"],
    ["div11", "Div 11"],
    ["MKT", "MKT"]
  ])("renders formatted label for %s", (leagueName, expectedLabel) => {
    render(<DivisionPill leagueName={leagueName} />);
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  it("applies an inline color style", () => {
    const { container } = render(<DivisionPill leagueName="Masters" />);
    const pill = container.firstChild as HTMLElement;
    expect(pill.style.color).toBeTruthy();
  });

  it("applies distinct colors for the top three tiers", () => {
    const { container: c1 } = render(<DivisionPill leagueName="Masters" />);
    const { container: c2 } = render(<DivisionPill leagueName="Challengers" />);
    const { container: c3 } = render(<DivisionPill leagueName="Prospects" />);
    const mastersColor = (c1.firstChild as HTMLElement).style.color;
    const challengersColor = (c2.firstChild as HTMLElement).style.color;
    const prospectsColor = (c3.firstChild as HTMLElement).style.color;
    expect(mastersColor).not.toBe(challengersColor);
    expect(challengersColor).not.toBe(prospectsColor);
    expect(mastersColor).not.toBe(prospectsColor);
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
  const map = { name: "de_nuke", home_score: 13, away_score: 9 };

  it("renders map name and scores", () => {
    render(<MapScoreChip map={map} winner="home" />);
    expect(screen.getByText("de_nuke")).toBeInTheDocument();
    expect(screen.getByText("13")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("bolds the winning side score", () => {
    const { container } = render(<MapScoreChip map={map} winner="home" />);
    const scores = container.querySelectorAll("span > span");
    const homeScore = Array.from(scores).find((el) => el.textContent === "13");
    const awayScore = Array.from(scores).find((el) => el.textContent === "9");
    expect(homeScore?.className).toContain("font-bold");
    expect(awayScore?.className).not.toContain("font-bold");
  });

  it("marks both sides as muted on draw", () => {
    const drawMap = { name: "de_mirage", home_score: 13, away_score: 13 };
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
