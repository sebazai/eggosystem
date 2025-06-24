import * as registrationModels from "../../../models/dashboard/registration.models";
import { runQuery } from "../../../db/mysqlRunQuery";
import type { PlayerFullName } from "@eggosystem/types";

jest.mock("../../../db/mysqlRunQuery");

describe("Dashboard Registration Models", () => {
  describe("getPlayerFullName", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return player full name when player exists", async () => {
      const mockPlayerFullName: PlayerFullName = {
        steam_id: "12345678901234567",
        full_name: "John Doe"
      };

      (runQuery as jest.Mock).mockResolvedValue([mockPlayerFullName]);

      const result =
        await registrationModels.getPlayerFullName("12345678901234567");

      expect(runQuery).toHaveBeenCalledWith(expect.stringContaining("SELECT"), [
        "12345678901234567"
      ]);
      expect(result).toEqual(mockPlayerFullName);
    });

    it("should return undefined when player not found", async () => {
      (runQuery as jest.Mock).mockResolvedValue([]);

      const result =
        await registrationModels.getPlayerFullName("12345678901234567");

      expect(runQuery).toHaveBeenCalledWith(expect.stringContaining("SELECT"), [
        "12345678901234567"
      ]);
      expect(result).toBeUndefined();
    });

    it("should handle null full_name", async () => {
      const mockPlayerFullName: PlayerFullName = {
        steam_id: "12345678901234567",
        full_name: null
      };

      (runQuery as jest.Mock).mockResolvedValue([mockPlayerFullName]);

      const result =
        await registrationModels.getPlayerFullName("12345678901234567");

      expect(runQuery).toHaveBeenCalledWith(expect.stringContaining("SELECT"), [
        "12345678901234567"
      ]);
      expect(result).toEqual(mockPlayerFullName);
    });

    it("should execute correct SQL query", async () => {
      (runQuery as jest.Mock).mockResolvedValue([]);

      await registrationModels.getPlayerFullName("12345678901234567");

      const queryCall = (runQuery as jest.Mock).mock.calls[0];
      const query = queryCall[0];
      const params = queryCall[1];

      expect(query).toContain("SELECT");
      expect(query).toContain("sp.steam_id");
      expect(query).toContain("a.full_name");
      expect(query).toContain("FROM SteamPlayers sp");
      expect(query).toContain("JOIN Accounts a ON a.id = sp.account_id");
      expect(query).toContain("WHERE sp.steam_id = ?");
      expect(params).toEqual(["12345678901234567"]);
    });
  });
});
