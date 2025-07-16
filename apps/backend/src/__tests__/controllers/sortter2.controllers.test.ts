import request from "supertest";
import { app } from "../../app";
import { getTeamValuesForSorter } from "../../models/sortter.models";
import { runQuery } from "../../db/mysqlRunQuery";

// Mock the model function
jest.mock("../../models/sortter.models");
jest.mock("../../db/mysqlRunQuery");
const mockGetTeamValuesForSorter =
  getTeamValuesForSorter as jest.MockedFunction<typeof getTeamValuesForSorter>;
const mockedRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("Sortter Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return team values for a given season", async () => {
    // Mock data setup
    const mockTeamValues = [
      {
        team_id: 2053,
        team_name: "CSKeisari",
        team_logo: "logo_url_1",
        league_name: "League 1",
        top5_sum: 1418,
        avg4: 288.75,
        top5_values: [300, 295, 285, 275, 263]
      }
    ];

    mockedRunQuery.mockResolvedValue([{ count: 0 }]); // No historical data
    mockGetTeamValuesForSorter.mockResolvedValue(mockTeamValues);

    // Make request to the endpoint
    const response = await request(app).get("/api/v1/sortter/season/14");

    // Verify response
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockTeamValues);

    // Verify model function was called with correct season ID
    expect(mockGetTeamValuesForSorter).toHaveBeenCalledWith(14, false);
  });

  it("should get a specific team by ID", async () => {
    // Mock data setup
    const mockTeamValues = [
      {
        team_id: 2053,
        team_name: "CSKeisari",
        team_logo: "logo_url_1",
        league_name: "League 1",
        top5_sum: 1418,
        avg4: 288.75,
        top5_values: [300, 295, 285, 275, 263]
      },
      {
        team_id: 2054,
        team_name: "TeamTwo",
        team_logo: "logo_url_2",
        league_name: "League 2",
        top5_sum: 1000,
        avg4: 200.0,
        top5_values: [250, 250, 250, 250, 0]
      }
    ];

    mockedRunQuery.mockResolvedValue([{ count: 0 }]); // No historical data
    mockGetTeamValuesForSorter.mockResolvedValue(mockTeamValues);

    // Make request to the endpoint
    const response = await request(app).get(
      "/api/v1/sortter/season/14/team/2053"
    );

    // Verify response
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockTeamValues[0]);

    // Verify model function was called with correct season ID
    expect(mockGetTeamValuesForSorter).toHaveBeenCalledWith(14, false);
  });

  it("should handle invalid season ID parameter", async () => {
    // Make request with invalid season ID
    const response = await request(app).get("/api/v1/sortter/season/invalid");

    // Verify response indicates bad request
    expect(response.status).toBe(400);
  });

  it("should handle team not found", async () => {
    // Mock empty data
    mockedRunQuery.mockResolvedValue([{ count: 0 }]); // No historical data
    mockGetTeamValuesForSorter.mockResolvedValue([]);

    // Make request with valid season but non-existent team
    const response = await request(app).get(
      "/api/v1/sortter/season/14/team/9999"
    );

    // Verify response indicates not found
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toContain("Team with ID 9999 not found");
  });
});
