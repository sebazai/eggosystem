import { getCachedGroupedPublicSponsors } from "./marketing-sponsors.services";
import { redisClient } from "../utils/redisClient";
import * as sponsorModels from "../models/marketing-sponsor.models";
import {
  createMockGroupedPublicSponsors,
  createMockPublicMarketingSponsor
} from "@eggosystem/types";

jest.mock("../models/marketing-sponsor.models");
jest.mock("../utils/redisClient");

const mockRedis = redisClient as jest.Mocked<typeof redisClient>;
const mockModels = sponsorModels as jest.Mocked<typeof sponsorModels>;

describe("marketing-sponsors.services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCachedGroupedPublicSponsors", () => {
    it("returns cached payload when JSON shape is fully valid", async () => {
      const payload = createMockGroupedPublicSponsors({
        game_wide_sponsors: [
          createMockPublicMarketingSponsor({
            id: 10,
            display_name: "Hero",
            external_url: "https://a.example",
            display_order: 1,
            image_phash: "ph1"
          })
        ]
      });
      mockRedis.get.mockResolvedValue(JSON.stringify(payload));

      const result = await getCachedGroupedPublicSponsors();

      expect(result).toEqual(payload);
      expect(mockModels.loadGroupedPublicSponsors).not.toHaveBeenCalled();
    });

    it("refreshes from DB when cache JSON is not valid JSON", async () => {
      const fresh = createMockGroupedPublicSponsors();
      mockRedis.get.mockResolvedValue("{{{not-json");
      mockModels.loadGroupedPublicSponsors.mockResolvedValue(fresh);

      const result = await getCachedGroupedPublicSponsors();

      expect(result).toEqual(fresh);
      expect(mockModels.loadGroupedPublicSponsors).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it("refreshes from DB when cache has shallow arrays but invalid rows", async () => {
      const fresh = createMockGroupedPublicSponsors();
      mockRedis.get.mockResolvedValue(
        JSON.stringify({
          game_wide_sponsors: [{ bogus: true }],
          main_partners: [],
          supporting_organizations: []
        })
      );
      mockModels.loadGroupedPublicSponsors.mockResolvedValue(fresh);

      const result = await getCachedGroupedPublicSponsors();

      expect(result).toEqual(fresh);
      expect(mockModels.loadGroupedPublicSponsors).toHaveBeenCalled();
    });
  });
});
