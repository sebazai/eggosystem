import request from "supertest";
import { createExpressTestApp } from "../../test-utils/express-app-setup";
import sponsorsRouter from "./sponsors.routes";
import * as marketingSponsorsService from "../../services/marketing-sponsors.services";
import { createMockGroupedPublicSponsors } from "@eggosystem/types";

jest.mock("../../services/marketing-sponsors.services");

const mockGetCached = jest.mocked(
  marketingSponsorsService.getCachedGroupedPublicSponsors
);

describe("GET /api/v1/sponsors", () => {
  const { app, cleanup } = createExpressTestApp(
    sponsorsRouter,
    "/api/v1/sponsors"
  );

  afterAll(() => {
    cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns grouped sponsors and short public cache headers", async () => {
    const payload = createMockGroupedPublicSponsors({
      main_partners: [
        {
          id: 1,
          display_name: "Partner",
          external_url: "https://example.com",
          display_order: 0,
          image_phash: "abc"
        }
      ]
    });
    mockGetCached.mockResolvedValue(payload);

    const res = await request(app).get("/api/v1/sponsors");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(payload);
    expect(res.headers["cache-control"]).toBe("public, max-age=300");
  });
});
