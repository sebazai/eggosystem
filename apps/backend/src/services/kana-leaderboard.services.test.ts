import { getKanaLeaderboard } from "./kana-leaderboard.services";
import { getTopLiveKanaEloPlayers } from "../models/steam-player-kana-elo.models";

jest.mock("../models/steam-player-kana-elo.models");

const mockGetTopLiveKanaEloPlayers =
  getTopLiveKanaEloPlayers as jest.MockedFunction<
    typeof getTopLiveKanaEloPlayers
  >;

/**
 * Build a synthetic top-N live list. Elo decreases as position increases so
 * ordering is deterministic. We craft elo values to land in known tiers:
 *  - positions 1-10  -> TOP_COCK (top-10 regardless of elo)
 *  - position 11     -> COCK_1 (>=190)
 *  - position 12     -> CHICKEN_2 (145-159)
 *  - position 13     -> CHICK_3 (75-89)
 *  - position 14     -> EGG_3 (0-44)
 */
const buildPlayers = () => [
  ...Array.from({ length: 10 }, (_value, index) => ({
    steam_id: `7656119800000000${index}`,
    nickname: `top_${index + 1}`,
    kana_elo: 200 - index
  })),
  { steam_id: "76561198000000011", nickname: "cock1", kana_elo: 195 },
  { steam_id: "76561198000000012", nickname: "chicken2", kana_elo: 150 },
  { steam_id: "76561198000000013", nickname: "chick3", kana_elo: 80 },
  { steam_id: "76561198000000014", nickname: "egg3", kana_elo: 20 }
];

describe("getKanaLeaderboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTopLiveKanaEloPlayers.mockResolvedValue(buildPlayers());
  });

  it("reads live ratings from SteamPlayerKanaElo with a limit of 50", async () => {
    await getKanaLeaderboard();
    expect(mockGetTopLiveKanaEloPlayers).toHaveBeenCalledWith(50);
  });

  it("returns all entries ordered highest elo first with 1-based positions", async () => {
    const result = await getKanaLeaderboard();

    expect(result.tier).toBeNull();
    expect(result.players).toHaveLength(14);
    expect(result.players[0].position).toBe(1);
    expect(result.players[0].nickname).toBe("top_1");
    expect(result.players[13].position).toBe(14);
    // Order preserved as provided by the model (already DESC).
    expect(result.players.map((player) => player.kana_elo)).toEqual([
      200, 199, 198, 197, 196, 195, 194, 193, 192, 191, 195, 150, 80, 20
    ]);
  });

  it("classifies top-10 positions as TOP_COCK regardless of elo", async () => {
    const result = await getKanaLeaderboard();
    const topTen = result.players.slice(0, 10);
    expect(topTen.every((player) => player.rank === "TOP_COCK")).toBe(true);
    expect(topTen.every((player) => player.subrank === 1)).toBe(true);
  });

  it("classifies players below top-10 by their kana elo threshold", async () => {
    const result = await getKanaLeaderboard();
    const byPosition = (position: number) =>
      result.players.find((player) => player.position === position);

    expect(byPosition(11)).toMatchObject({ rank: "COCK", subrank: 1 });
    expect(byPosition(12)).toMatchObject({ rank: "CHICKEN", subrank: 2 });
    expect(byPosition(13)).toMatchObject({ rank: "CHICK", subrank: 3 });
    expect(byPosition(14)).toMatchObject({ rank: "EGG", subrank: 3 });
  });

  it("builds a steam community profile url for each entry", async () => {
    const result = await getKanaLeaderboard();
    expect(result.players[0].profile_url).toBe(
      "https://steamcommunity.com/profiles/76561198000000000"
    );
  });

  it("filters by TOP_COCK tier without changing positions", async () => {
    const result = await getKanaLeaderboard("TOP_COCK");
    expect(result.tier).toBe("TOP_COCK");
    expect(result.players).toHaveLength(10);
    // Positions remain the global top-50 positions.
    expect(result.players.map((player) => player.position)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    ]);
  });

  it("filters by an exact sub-rank tier", async () => {
    const result = await getKanaLeaderboard("CHICKEN_2");
    expect(result.players).toHaveLength(1);
    expect(result.players[0]).toMatchObject({
      position: 12,
      rank: "CHICKEN",
      subrank: 2
    });
  });

  it("broad COCK grouping does not include TOP_COCK entries", async () => {
    const result = await getKanaLeaderboard("COCK");
    // Only position 11 is classified rank COCK; the top-10 are TOP_COCK.
    expect(result.players).toHaveLength(1);
    expect(result.players[0].position).toBe(11);
    expect(result.players[0].rank).toBe("COCK");
  });

  it("returns an empty list when no entry matches the tier", async () => {
    const result = await getKanaLeaderboard("EGG_1");
    expect(result.players).toHaveLength(0);
    expect(result.tier).toBe("EGG_1");
  });

  it("handles an empty leaderboard", async () => {
    mockGetTopLiveKanaEloPlayers.mockResolvedValue([]);
    const result = await getKanaLeaderboard();
    expect(result.players).toHaveLength(0);
  });
});
