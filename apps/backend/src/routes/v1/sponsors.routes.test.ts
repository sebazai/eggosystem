import request from "supertest";
import { createExpressTestApp } from "../../test-utils/express-app-setup";
import sponsorsRouter from "./sponsors.routes";
import * as marketingSponsorsService from "../../services/marketing-sponsors.services";
import * as gameModels from "../../models/game.models";
import {
  createMockGroupedPublicSponsors,
  createMockPublicMarketingSponsor
} from "@eggosystem/types";

jest.mock("../../services/marketing-sponsors.services");

const mockGetCached = jest.mocked(
  marketingSponsorsService.getCachedGroupedPublicSponsors
);
const mockGetCachedGameWide = jest.mocked(
  marketingSponsorsService.getCachedGameWidePublicSponsorsByGameId
);

const mockGetGameByAbbreviationCi = jest.spyOn(
  gameModels,
  "getGameByAbbreviationCi"
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
      game_wide_sponsors: [
        createMockPublicMarketingSponsor({
          id: 2,
          display_name: "Featured",
          external_url: null,
          display_order: 0,
          image_phash: "gw"
        })
      ],
      main_partners: [
        createMockPublicMarketingSponsor({
          id: 1,
          display_name: "Partner",
          external_url: "https://example.com",
          display_order: 0,
          image_phash: "abc"
        })
      ],
      supporting_organizations: [
        createMockPublicMarketingSponsor({
          id: 3,
          display_name: "Supporter",
          external_url: "https://support.example",
          display_order: 2,
          image_phash: null
        })
      ]
    });
    mockGetCached.mockResolvedValue(payload);

    const res = await request(app).get("/api/v1/sponsors");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(payload);
    expect(res.headers["cache-control"]).toBe("public, max-age=300");
    expect(Array.isArray(res.body.game_wide_sponsors)).toBe(true);
    expect(Array.isArray(res.body.main_partners)).toBe(true);
    expect(Array.isArray(res.body.supporting_organizations)).toBe(true);
  });
});

describe("GET /api/v1/sponsors/games/:game_abbreviation", () => {
  const { app, cleanup } = createExpressTestApp(
    sponsorsRouter,
    "/api/v1/sponsors"
  );

  afterAll(() => {
    mockGetGameByAbbreviationCi.mockRestore();
    cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetGameByAbbreviationCi.mockResolvedValue({
      id: 1,
      name: "Counter-Strike 2",
      abbreviation: "CS2",
      app_id: 730
    });
    mockGetCachedGameWide.mockResolvedValue([
      createMockPublicMarketingSponsor({
        id: 9,
        display_name: "GW",
        display_order: 0,
        image_phash: "phgw"
      })
    ]);
  });

  it("returns game-wide sponsors and cache headers", async () => {
    const res = await request(app).get("/api/v1/sponsors/games/cs2");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      sponsors: [
        createMockPublicMarketingSponsor({
          id: 9,
          display_name: "GW",
          display_order: 0,
          image_phash: "phgw"
        })
      ]
    });
    expect(res.headers["cache-control"]).toBe("public, max-age=300");
    expect(mockGetCachedGameWide).toHaveBeenCalledWith(1);
  });
});
