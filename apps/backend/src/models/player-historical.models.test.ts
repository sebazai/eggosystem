import { getPlayerHistoricalData } from "./player-historical.models";
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
