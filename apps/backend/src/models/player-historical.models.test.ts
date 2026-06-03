import {
  getPlayerHistoricalData,
  getPlayerSeasonsContext
} from "./player-historical.models";
import { runQuery } from "../db/mysqlRunQuery";

jest.mock("../db/mysqlRunQuery");

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("getPlayerHistoricalData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockResolvedValue([]);
  });

  it("filters by an explicit season_id via a bound parameter (not interpolation)", async () => {
    await getPlayerHistoricalData("steam-1", { season_id: 16 });

    const [sql, binds] = mockRunQuery.mock.calls[0];
    expect(sql).toContain("AND m.season_id = ?");
    expect(sql).not.toContain("LIMIT");
    expect(binds).toEqual(["steam-1", 16]);
  });

  it("limits by a whitelisted game count when no season is selected", async () => {
    await getPlayerHistoricalData("steam-1", { games: 15 });

    const [sql, binds] = mockRunQuery.mock.calls[0];
    expect(sql).toContain("LIMIT 15");
    expect(binds).toEqual(["steam-1"]);
  });

  it("never interpolates a non-integer games value into the LIMIT clause", async () => {
    await getPlayerHistoricalData("steam-1", {
      games: "15; DROP TABLE PlayerStats" as unknown as number
    });

    const [sql] = mockRunQuery.mock.calls[0];
    expect(sql).not.toContain("LIMIT");
    expect(sql).not.toContain("DROP TABLE");
  });

  it("returns all data when neither season nor games is provided", async () => {
    await getPlayerHistoricalData("steam-1", {});

    const [sql, binds] = mockRunQuery.mock.calls[0];
    expect(sql).not.toContain("LIMIT");
    expect(sql).not.toContain("AND m.season_id");
    expect(binds).toEqual(["steam-1"]);
  });
});

describe("getPlayerSeasonsContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunQuery.mockResolvedValue([]);
  });

  it("scopes current and last season by organizer, app_id, and gametype", async () => {
    await getPlayerSeasonsContext("steam-1", {
      organizer_id: 1,
      app_id: 730,
      gametype: "comp"
    });

    expect(mockRunQuery).toHaveBeenCalledTimes(2);

    for (const [sql, binds] of mockRunQuery.mock.calls) {
      expect(sql).toContain("JOIN GameTypes gt");
      expect(sql).toContain("JOIN Organizers o");
      expect(sql).toContain("AND o.id = ?");
      expect(sql).toContain("AND LOWER(gt.name) = LOWER(?)");
      expect(binds).toEqual(["steam-1", 730, 1, "comp"]);
    }
  });
});
