import { render } from "@testing-library/react";
import { PlayerStatisticsForTeam } from "./PlayerStatisticsForTeam";
import type { MatchPlayerStats, MatchInfo } from "@eggosystem/types";

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }) => <img src={src} alt={alt} {...props} />
}));

// Mock NextImageFallback
jest.mock("@/components/layout/NextImageFallback", () => ({
  NextImageFallback: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }) => <img src={src} alt={alt} {...props} />
}));

const mockPlayerStats: MatchPlayerStats[] = [
  {
    team_id: 1,
    nickname: "Player1",
    steam_id: "76561198012345678",
    kills: 22,
    deaths: 15,
    assists: 5,
    flash_assists: 2,
    adr: 85.5,
    kast_percentage: 72.5,
    hs_percent: 48.0,
    kana_rating: 1.25,
    first_kills: 3,
    first_deaths: 1,
    utility_damage: 120,
    headshots: 11,
    enemies_flashed: 4
  },
  {
    team_id: 1,
    nickname: "Player2",
    steam_id: "76561198012345679",
    kills: 18,
    deaths: 17,
    assists: 7,
    flash_assists: 3,
    adr: 72.3,
    kast_percentage: 68.0,
    hs_percent: 52.0,
    kana_rating: 1.05,
    first_kills: 1,
    first_deaths: 2,
    utility_damage: 80,
    headshots: 9,
    enemies_flashed: 5
  },
  {
    team_id: 2,
    nickname: "Player3",
    steam_id: "76561198012345680",
    kills: 20,
    deaths: 16,
    assists: 4,
    flash_assists: 1,
    adr: 78.2,
    kast_percentage: 70.0,
    hs_percent: 45.0,
    kana_rating: 1.15,
    first_kills: 2,
    first_deaths: 1,
    utility_damage: 95,
    headshots: 9,
    enemies_flashed: 2
  }
];

const mockTeams: MatchInfo["teams"] = {
  1: {
    id: 1,
    name: "Team Alpha",
    logo: "team-alpha-logo.png",
    score: 16,
    rank: 1
  },
  2: {
    id: 2,
    name: "Team Beta",
    logo: "team-beta-logo.png",
    score: 12,
    rank: 2
  }
};

describe("PlayerStatisticsForTeam", () => {
  describe("Snapshot Tests", () => {
    it("renders correctly with player stats for both teams", () => {
      const { container } = render(
        <PlayerStatisticsForTeam
          playerStats={mockPlayerStats}
          teams={mockTeams}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it("renders correctly with CT side selected", () => {
      const { container } = render(
        <PlayerStatisticsForTeam
          playerStats={mockPlayerStats}
          teams={mockTeams}
          selectedStat="CT"
        />
      );
      expect(container).toMatchSnapshot();
    });

    it("renders correctly with T side selected", () => {
      const { container } = render(
        <PlayerStatisticsForTeam
          playerStats={mockPlayerStats}
          teams={mockTeams}
          selectedStat="T"
        />
      );
      expect(container).toMatchSnapshot();
    });

    it("renders correctly with filter params", () => {
      const { container } = render(
        <PlayerStatisticsForTeam
          playerStats={mockPlayerStats}
          teams={mockTeams}
          playerStatsFilters={{ seasons: "1", leagues: "1" }}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it("renders correctly with empty player stats", () => {
      const { container } = render(
        <PlayerStatisticsForTeam playerStats={[]} teams={mockTeams} />
      );
      expect(container).toMatchSnapshot();
    });
  });
});
