import {
  getTopLiveKanaEloPlayers,
  upsertPlayerKanaElo
} from "./steam-player-kana-elo.models";
import { runQuery } from "../db/mysqlRunQuery";

jest.mock("../db/mysqlRunQuery");

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("Steam Player Kana Elo Models", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getTopLiveKanaEloPlayers", () => {
    it("reads live ratings from SteamPlayerKanaElo joined to SteamPlayers", async () => {
      const rows = [
        { steam_id: "76561198000000001", kana_elo: 200, nickname: "a" },
        { steam_id: "76561198000000002", kana_elo: 180, nickname: "b" }
      ];
      mockRunQuery.mockResolvedValue(rows);

      const result = await getTopLiveKanaEloPlayers(50);

      expect(result).toEqual(rows);
      expect(mockRunQuery).toHaveBeenCalledTimes(1);

      const [sql, params] = mockRunQuery.mock.calls[0];
      expect(sql).toContain("FROM SteamPlayerKanaElo spke");
      expect(sql).toContain(
        "JOIN SteamPlayers sp ON sp.steam_id = spke.steam_id"
      );
      expect(sql).toContain("ORDER BY spke.kana_elo DESC");
      expect(sql).not.toContain("SeasonPlayerRanks");
      expect(params).toEqual([50]);
    });
  });

  describe("upsertPlayerKanaElo", () => {
    it("upserts the player kana elo", async () => {
      mockRunQuery.mockResolvedValue([]);

      await upsertPlayerKanaElo("76561198000000001", 123);

      const [sql, params] = mockRunQuery.mock.calls[0];
      expect(sql).toContain("INSERT INTO SteamPlayerKanaElo");
      expect(params).toEqual(["76561198000000001", 123]);
    });
  });
});
