import request from "supertest";
import express from "express";
import { runQuery } from "../../../db/mysqlRunQuery";

// Mock the model functions
jest.mock("../../../models/dashboard/sortter.models");
jest.mock("../../../db/mysqlRunQuery");
const mockedRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
import { getTeamValuesForSortter } from "../../../models/dashboard/sortter.models";
import sortterRouter from "./sortter.routes";
import { expressErrorHandler } from "../../../middlewares/express-error-handler";

describe("Integration Tests", () => {
  const mockGetTeamValuesForSorter =
    getTeamValuesForSortter as jest.MockedFunction<
      typeof getTeamValuesForSortter
    >;

  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/sortter", sortterRouter);
    app.use(expressErrorHandler);
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /sortter/season/:season/teams", () => {
    it("should return team values for a given season", async () => {
      // Mock data setup
      const mockTeamValues = [
        {
          team_id: 2053,
          team_name: "CSKeisari",
          team_logo: "logo_url_1",
          league_name: "League 1",
          top5_sum: 1418,
          avg5: 283.6,
          orig5: 283.6,
          top5_values: [300, 295, 285, 275, 263],
          top5_offered_values: [300, 295, 285, 275, 263],
          is_flagged: false
        }
      ];

      mockedRunQuery.mockResolvedValue([{ count: 0 }]); // No historical data
      mockGetTeamValuesForSorter.mockResolvedValue(mockTeamValues);

      // Make request to the endpoint with authentication
      const response = await request(app)
        .get("/sortter/season/14/teams")
        .set("Authorization", "Bearer mock-access-token");

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTeamValues);

      // Verify model function was called with correct season ID
      expect(mockGetTeamValuesForSorter).toHaveBeenCalledWith(14);
    });

    it("should handle invalid season ID parameter", async () => {
      // Make request with invalid season ID
      const response = await request(app)
        .get("/sortter/season/invalid")
        .set("Authorization", "Bearer mock-access-token");

      // Verify response indicates not found (invalid season ID results in 404, not 400)
      expect(response.status).toBe(404);
    });
  });

  describe("GET /sortter/season/:season/team/:team", () => {
    it("should get a specific team by ID", async () => {
      // Mock data setup
      const mockTeamValues = [
        {
          team_id: 2053,
          team_name: "CSKeisari",
          team_logo: "logo_url_1",
          league_name: "League 1",
          top5_sum: 1418,
          avg5: 283.6,
          orig5: 283.6,
          top5_values: [300, 295, 285, 275, 263],
          top5_offered_values: [300, 295, 285, 275, 263],
          is_flagged: false
        },
        {
          team_id: 2054,
          team_name: "TeamTwo",
          team_logo: "logo_url_2",
          league_name: "League 2",
          top5_sum: 1000,
          avg5: 200.0,
          orig5: 200.0,
          top5_values: [250, 250, 250, 250, 0],
          top5_offered_values: [250, 250, 250, 250, 0],
          is_flagged: false
        }
      ];

      mockedRunQuery.mockResolvedValue([{ count: 0 }]); // No historical data
      mockGetTeamValuesForSorter.mockResolvedValue(mockTeamValues);

      // Make request to the endpoint with authentication
      const response = await request(app)
        .get("/sortter/season/14/team/2053")
        .set("Authorization", "Bearer mock-access-token");

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTeamValues[0]);

      // Verify model function was called with correct season ID
      expect(mockGetTeamValuesForSorter).toHaveBeenCalledWith(14);
    });

    it("should handle team not found", async () => {
      // Mock empty data
      mockedRunQuery.mockResolvedValue([{ count: 0 }]); // No historical data
      mockGetTeamValuesForSorter.mockResolvedValue([]);

      // Make request with valid season but non-existent team
      const response = await request(app)
        .get("/sortter/season/14/team/9999")
        .set("Authorization", "Bearer mock-access-token");

      // Verify response indicates not found
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: "Team with ID 9999 not found for season 14",
        instance: "/sortter/season/14/team/9999"
      });
    });
  });
});
