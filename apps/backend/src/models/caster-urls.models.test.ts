import {
  getCasterDefaultUrl,
  setCasterDefaultUrl,
  deleteCasterDefaultUrl
} from "./caster-urls.models";
import { runQuery } from "../db/mysqlRunQuery";
import type { CasterUrl } from "@eggosystem/types";

jest.mock("../db/mysqlRunQuery");

const mockRunQuery = runQuery as jest.Mock;

const mockCasterUrl: CasterUrl = {
  id: 1,
  account_id: 1,
  default_stream_url: "https://twitch.tv/testcaster",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z"
};

describe("caster-urls models", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getCasterDefaultUrl", () => {
    it("should return default URL if exists", async () => {
      mockRunQuery.mockResolvedValueOnce([
        { default_stream_url: "https://twitch.tv/testcaster" }
      ]);

      const result = await getCasterDefaultUrl(1);

      expect(result).toBe("https://twitch.tv/testcaster");
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT default_stream_url FROM AccountCasterUrls WHERE account_id = ?",
        [1]
      );
    });

    it("should return null if no default URL exists", async () => {
      mockRunQuery.mockResolvedValueOnce([]);

      const result = await getCasterDefaultUrl(1);

      expect(result).toBeNull();
    });
  });

  describe("setCasterDefaultUrl", () => {
    it("should successfully set default URL", async () => {
      // Mock the INSERT...ON DUPLICATE KEY UPDATE
      mockRunQuery.mockResolvedValueOnce({});
      // Mock the SELECT result
      mockRunQuery.mockResolvedValueOnce([mockCasterUrl]);

      const result = await setCasterDefaultUrl(
        1,
        "https://twitch.tv/testcaster"
      );

      expect(mockRunQuery).toHaveBeenCalledTimes(2);
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("INSERT INTO AccountCasterUrls"),
        [1, "https://twitch.tv/testcaster"]
      );
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        "SELECT * FROM AccountCasterUrls WHERE account_id = ?",
        [1]
      );
      expect(result).toEqual(mockCasterUrl);
    });

    it("should update existing URL", async () => {
      const updatedUrl = {
        ...mockCasterUrl,
        default_stream_url: "https://twitch.tv/newcaster"
      };

      mockRunQuery.mockResolvedValueOnce({});
      mockRunQuery.mockResolvedValueOnce([updatedUrl]);

      const result = await setCasterDefaultUrl(
        1,
        "https://twitch.tv/newcaster"
      );

      expect(result).toEqual(updatedUrl);
    });
  });

  describe("deleteCasterDefaultUrl", () => {
    it("should successfully delete default URL", async () => {
      mockRunQuery.mockResolvedValueOnce({ affectedRows: 1 });

      const result = await deleteCasterDefaultUrl(1);

      expect(result).toBe(true);
      expect(mockRunQuery).toHaveBeenCalledWith(
        "DELETE FROM AccountCasterUrls WHERE account_id = ?",
        [1]
      );
    });

    it("should return false if no URL to delete", async () => {
      mockRunQuery.mockResolvedValueOnce({ affectedRows: 0 });

      const result = await deleteCasterDefaultUrl(1);

      expect(result).toBe(false);
    });
  });
});
