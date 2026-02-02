import {
  getCasterDefaultUrl,
  getCasterUrls,
  addCasterUrl,
  deleteCasterUrlById,
  setCasterDefaultUrlById,
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
  stream_url: "https://twitch.tv/testcaster",
  is_default: true,
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
        { stream_url: "https://twitch.tv/testcaster" }
      ]);

      const result = await getCasterDefaultUrl(1);

      expect(result).toBe("https://twitch.tv/testcaster");
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT stream_url FROM AccountCasterUrls WHERE account_id = ? AND is_default = true",
        [1]
      );
    });

    it("should return null if no default URL exists", async () => {
      mockRunQuery.mockResolvedValueOnce([]);

      const result = await getCasterDefaultUrl(1);

      expect(result).toBeNull();
    });
  });

  describe("getCasterUrls", () => {
    it("should return all URLs for account ordered by default then id", async () => {
      mockRunQuery.mockResolvedValueOnce([mockCasterUrl]);

      const result = await getCasterUrls(1);

      expect(result).toEqual([mockCasterUrl]);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT id, account_id, stream_url, is_default"
        ),
        [1]
      );
    });

    it("should return empty array when no URLs", async () => {
      mockRunQuery.mockResolvedValueOnce([]);

      const result = await getCasterUrls(1);

      expect(result).toEqual([]);
    });
  });

  describe("addCasterUrl", () => {
    it("should insert new URL and return it", async () => {
      mockRunQuery.mockResolvedValueOnce({});
      mockRunQuery.mockResolvedValueOnce([mockCasterUrl]);

      const result = await addCasterUrl(1, "https://twitch.tv/testcaster");

      expect(result).toEqual(mockCasterUrl);
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("INSERT INTO AccountCasterUrls"),
        [1, "https://twitch.tv/testcaster"]
      );
    });
  });

  describe("deleteCasterUrlById", () => {
    it("should delete URL and return true", async () => {
      mockRunQuery.mockResolvedValueOnce({ affectedRows: 1 });

      const result = await deleteCasterUrlById(1, 5);

      expect(result).toBe(true);
      expect(mockRunQuery).toHaveBeenCalledWith(
        "DELETE FROM AccountCasterUrls WHERE account_id = ? AND id = ?",
        [1, 5]
      );
    });

    it("should return false when no row deleted", async () => {
      mockRunQuery.mockResolvedValueOnce({ affectedRows: 0 });

      const result = await deleteCasterUrlById(1, 999);

      expect(result).toBe(false);
    });
  });

  describe("setCasterDefaultUrlById", () => {
    it("should set URL as default and return it", async () => {
      mockRunQuery.mockResolvedValueOnce({});
      mockRunQuery.mockResolvedValueOnce({});
      mockRunQuery.mockResolvedValueOnce([mockCasterUrl]);

      const result = await setCasterDefaultUrlById(1, 5);

      expect(result).toEqual(mockCasterUrl);
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("SET is_default = false"),
        [1]
      );
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("SET is_default = true"),
        [1, 5]
      );
    });
  });

  describe("setCasterDefaultUrl", () => {
    it("should unset other defaults, insert or update URL as default, and return it", async () => {
      mockRunQuery.mockResolvedValueOnce({});
      mockRunQuery.mockResolvedValueOnce({});
      mockRunQuery.mockResolvedValueOnce([mockCasterUrl]);

      const result = await setCasterDefaultUrl(
        1,
        "https://twitch.tv/testcaster"
      );

      expect(result).toEqual(mockCasterUrl);
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("SET is_default = false"),
        [1]
      );
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("INSERT INTO AccountCasterUrls"),
        [1, "https://twitch.tv/testcaster"]
      );
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        3,
        "SELECT * FROM AccountCasterUrls WHERE account_id = ? AND stream_url = ?",
        [1, "https://twitch.tv/testcaster"]
      );
    });
  });

  describe("deleteCasterDefaultUrl", () => {
    it("should clear default (set all is_default false) and return true", async () => {
      mockRunQuery.mockResolvedValueOnce({});

      const result = await deleteCasterDefaultUrl(1);

      expect(result).toBe(true);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SET is_default = false"),
        [1]
      );
    });
  });
});
