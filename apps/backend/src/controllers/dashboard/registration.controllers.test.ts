import * as registrationControllers from "./registration.controllers";
import * as registrationModels from "../../models/dashboard/registration.models";
import type { PlayerFullName, RequestWithParams } from "@eggosystem/types";
import type { Response } from "express";

describe("Dashboard Registration Controllers", () => {
  const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  describe("getPlayerFullNameController", () => {
    let req: RequestWithParams<{ steamId: string }>, res: Response;

    beforeEach(() => {
      req = {
        params: { steamId: "12345678901234567" }
      } as RequestWithParams<{ steamId: string }>;
      res = mockResponse();
    });

    it("should return player full name when player exists", async () => {
      const mockPlayerFullName: PlayerFullName = {
        steam_id: "12345678901234567",
        full_name: "John Doe"
      };

      jest
        .spyOn(registrationModels, "getPlayerFullName")
        .mockResolvedValue(mockPlayerFullName);

      await registrationControllers.getPlayerFullNameController(req, res);

      expect(registrationModels.getPlayerFullName).toHaveBeenCalledWith(
        "12345678901234567"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockPlayerFullName);
    });

    it("should return 404 when player not found", async () => {
      jest
        .spyOn(registrationModels, "getPlayerFullName")
        .mockResolvedValue(undefined);

      await registrationControllers.getPlayerFullNameController(req, res);

      expect(registrationModels.getPlayerFullName).toHaveBeenCalledWith(
        "12345678901234567"
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Player not found" });
    });

    it("should handle null full_name", async () => {
      const mockPlayerFullName: PlayerFullName = {
        steam_id: "12345678901234567",
        full_name: null
      };

      jest
        .spyOn(registrationModels, "getPlayerFullName")
        .mockResolvedValue(mockPlayerFullName);

      await registrationControllers.getPlayerFullNameController(req, res);

      expect(registrationModels.getPlayerFullName).toHaveBeenCalledWith(
        "12345678901234567"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockPlayerFullName);
    });
  });
});
