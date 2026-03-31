import type Redis from "ioredis";
import { scanKeysMatchingPattern } from "./redisScanKeys";

describe("scanKeysMatchingPattern", () => {
  it("aggregates SCAN batches, dedupes, and sorts", async () => {
    const scan = jest
      .fn()
      .mockResolvedValueOnce(["next", ["z:1", "a:1"]])
      .mockResolvedValueOnce(["0", ["a:1", "m:2"]]);
    const client = { scan } as unknown as Redis;

    const keys = await scanKeysMatchingPattern(client, "prefix:*");

    expect(keys).toEqual(["a:1", "m:2", "z:1"]);
    expect(scan).toHaveBeenNthCalledWith(
      1,
      "0",
      "MATCH",
      "prefix:*",
      "COUNT",
      500
    );
    expect(scan).toHaveBeenNthCalledWith(
      2,
      "next",
      "MATCH",
      "prefix:*",
      "COUNT",
      500
    );
  });
});
