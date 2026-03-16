import type { ChampionshipCreatedWebhook } from "@eggosystem/types";
import { SeasonPlatform, createMockSeason } from "@eggosystem/types";
import {
  addChampionshipToDatabase,
  extractManualGroupFromName,
  extractSeasonHintFromName,
  resolveLeagueNameFromChampionshipName,
  stageFromChampionshipType
} from "./season-league-external-id.services";
import { getOrganizerFaceitSeasonForApp } from "../models/organizer.models";
import {
  getSeasonLeagueBySeasonAndFaceitName,
  getSeasonLeagueSearchNames
} from "../models/season-league.models";
import { insertSeasonLeagueExternalId } from "../models/season-league-external-id.models";

jest.mock("../models/organizer.models");
jest.mock("../models/season-league.models");
jest.mock("../models/season-league-external-id.models");

const mockGetOrganizerFaceitSeasonForApp = jest.mocked(
  getOrganizerFaceitSeasonForApp
);
const mockGetSeasonLeagueSearchNames = jest.mocked(getSeasonLeagueSearchNames);
const mockGetSeasonLeagueBySeasonAndFaceitName = jest.mocked(
  getSeasonLeagueBySeasonAndFaceitName
);
const mockInsertSeasonLeagueExternalId = jest.mocked(
  insertSeasonLeagueExternalId
);

const defaultSeasonLeagueNames = [
  { leagueName: "div5", searchName: "5" },
  { leagueName: "div11", searchName: "11" },
  { leagueName: "Masters", searchName: "Masters" }
];

type WebhookOverrides = Partial<Omit<ChampionshipCreatedWebhook, "payload">> & {
  payload?: Partial<ChampionshipCreatedWebhook["payload"]>;
};

function buildWebhook(
  overrides?: WebhookOverrides
): ChampionshipCreatedWebhook {
  const base: ChampionshipCreatedWebhook = {
    transaction_id: "tx-1",
    event: "championship_created",
    event_id: "evt-1",
    third_party_id: "tp-1",
    app_id: "6d9298b7-73e4-4672-96b5-720293ba2a4a",
    timestamp: new Date().toISOString(),
    retry_count: 0,
    version: 1,
    payload: {
      id: "external-id-123",
      name: "5 Div S4 Lohko A",
      owner_id: "owner-1",
      organizer_id: "org-123",
      game: "cs2",
      region: "EU",
      description: "",
      type: "roundRobin",
      status: "created",
      published: false,
      featured: false,
      archived: false,
      admin_tool_enabled: true,
      check_in_enabled: true,
      rulesId: "",
      slots: 16,
      total_rounds: 15,
      total_groups: 1,
      check_in_clear: new Date().toISOString(),
      check_in_start: new Date().toISOString(),
      subscription_end: new Date().toISOString(),
      subscription_start: new Date().toISOString(),
      assets: undefined,
      roles: undefined
    }
  };

  return {
    ...base,
    ...overrides,
    payload: {
      ...base.payload,
      ...(overrides?.payload ?? {})
    }
  };
}

describe("extractManualGroupFromName", () => {
  it("returns 1 for Lohko A", () => {
    expect(extractManualGroupFromName("5 Div S4 Lohko A")).toBe(1);
    expect(extractManualGroupFromName("Lohko A 5 Div")).toBe(1);
    expect(extractManualGroupFromName("lohko a")).toBe(1);
  });

  it("returns 2 for Lohko B", () => {
    expect(extractManualGroupFromName("5 Div S4 Lohko B")).toBe(2);
    expect(extractManualGroupFromName("Lohko B")).toBe(2);
  });

  it("returns 3 for Lohko C and for Lohko 3", () => {
    expect(extractManualGroupFromName("Lohko C Playoffs")).toBe(3);
    expect(extractManualGroupFromName("11 DIV S3 Lohko 3")).toBe(3);
  });

  it("accepts multiple spaces after Lohko", () => {
    expect(extractManualGroupFromName("Lohko   A")).toBe(1);
  });

  it("returns null when no Lohko match", () => {
    expect(extractManualGroupFromName("Masters S4 Playoffs")).toBe(null);
    expect(extractManualGroupFromName("")).toBe(null);
  });

  it("returns null for invalid Lohko value", () => {
    expect(extractManualGroupFromName("Lohko 0")).toBe(null);
    expect(extractManualGroupFromName("Lohko AB")).toBe(null);
  });
});

describe("stageFromChampionshipType", () => {
  it("returns 1 for roundRobin", () => {
    expect(stageFromChampionshipType("roundRobin")).toBe(1);
  });
  it("returns 2 for doubleElimination", () => {
    expect(stageFromChampionshipType("doubleElimination")).toBe(2);
  });
  it("returns 1 for other types (default)", () => {
    expect(stageFromChampionshipType("singleElimination")).toBe(1);
    expect(stageFromChampionshipType("unknown")).toBe(1);
  });
});

describe("extractSeasonHintFromName", () => {
  it('returns "S{n}" for S followed by digits', () => {
    expect(extractSeasonHintFromName("Masters S5 Playoffs")).toBe("S5");
    expect(extractSeasonHintFromName("5 Div S4 Lohko A")).toBe("S4");
    expect(extractSeasonHintFromName("ESEA S54 EU Elite")).toBe("S54");
  });

  it("allows optional space between S and digits", () => {
    expect(extractSeasonHintFromName("Masters S 5 Playoffs")).toBe("S5");
  });

  it('returns "Season {n}" for Season followed by digits', () => {
    expect(extractSeasonHintFromName("League Season 5 Playoffs")).toBe(
      "Season 5"
    );
    expect(extractSeasonHintFromName("Season 12")).toBe("Season 12");
  });

  it("prefers S{n} over Season {n} when both match", () => {
    expect(extractSeasonHintFromName("S3 Season 3")).toBe("S3");
  });

  it("returns empty string when no season pattern", () => {
    expect(extractSeasonHintFromName("Masters Playoffs")).toBe("");
    expect(extractSeasonHintFromName("")).toBe("");
  });
});

describe("resolveLeagueNameFromChampionshipName", () => {
  it("matches known league search name in championship name (word boundary)", async () => {
    mockGetSeasonLeagueSearchNames.mockResolvedValue(defaultSeasonLeagueNames);
    await expect(
      resolveLeagueNameFromChampionshipName("5 Div S4 Lohko A", 77)
    ).resolves.toBe("5");
    await expect(
      resolveLeagueNameFromChampionshipName("Masters S4 Playoffs", 77)
    ).resolves.toBe("Masters");
    await expect(
      resolveLeagueNameFromChampionshipName("11 DIV S3 Playoffs", 77)
    ).resolves.toBe("11");
  });

  it("prefers longest match (11 over 1)", async () => {
    mockGetSeasonLeagueSearchNames.mockResolvedValue(defaultSeasonLeagueNames);
    await expect(
      resolveLeagueNameFromChampionshipName("11 DIV S3", 77)
    ).resolves.toBe("11");
  });

  it("falls back to first word when no league matches", async () => {
    mockGetSeasonLeagueSearchNames.mockResolvedValue([
      { leagueName: "Masters", searchName: "Masters" }
    ]);
    await expect(
      resolveLeagueNameFromChampionshipName("Unknown League S4", 77)
    ).resolves.toBe("Unknown");
  });
});

describe("addChampionshipToDatabase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSeasonLeagueSearchNames.mockResolvedValue(defaultSeasonLeagueNames);
  });

  it("throws when no active organizer season exists", async () => {
    mockGetOrganizerFaceitSeasonForApp.mockResolvedValueOnce(undefined);

    const webhook = buildWebhook();

    await expect(addChampionshipToDatabase(webhook)).rejects.toThrow(
      /No active organizer season found/
    );

    expect(mockGetOrganizerFaceitSeasonForApp).toHaveBeenCalledWith(
      webhook.payload.organizer_id,
      "S4",
      730
    );
    expect(mockGetSeasonLeagueBySeasonAndFaceitName).not.toHaveBeenCalled();
    expect(mockInsertSeasonLeagueExternalId).not.toHaveBeenCalled();
  });

  it("throws when season league cannot be resolved from name prefix", async () => {
    const mockSeason = createMockSeason({
      id: 77,
      name: "S4",
      full_name: "Season 4",
      signup_start_date: new Date().toISOString().slice(0, 10),
      signup_end_date: new Date().toISOString().slice(0, 10),
      platform: SeasonPlatform.FACEIT,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: null
    });
    mockGetOrganizerFaceitSeasonForApp.mockResolvedValueOnce(mockSeason);

    mockGetSeasonLeagueBySeasonAndFaceitName.mockResolvedValueOnce(undefined);

    const webhook = buildWebhook({
      payload: {
        name: "5 Div S4 Lohko A",
        type: "roundRobin"
      }
    });

    await expect(addChampionshipToDatabase(webhook)).rejects.toThrow(
      /Season league not found/
    );

    expect(mockGetSeasonLeagueBySeasonAndFaceitName).toHaveBeenCalledWith(
      77,
      "5"
    );
    expect(mockInsertSeasonLeagueExternalId).not.toHaveBeenCalled();
  });

  it("inserts with stage=1 and is_round_robin_bo2_as_2xbo1=true for roundRobin", async () => {
    const mockSeason = createMockSeason({
      id: 77,
      name: "S4",
      full_name: "Season 4",
      signup_start_date: new Date().toISOString().slice(0, 10),
      signup_end_date: new Date().toISOString().slice(0, 10),
      platform: SeasonPlatform.FACEIT,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: null
    });
    mockGetOrganizerFaceitSeasonForApp.mockResolvedValueOnce(mockSeason);

    mockGetSeasonLeagueBySeasonAndFaceitName.mockResolvedValueOnce({
      tier: 3,
      season_id: 77,
      league_id: 5
    });

    const webhook = buildWebhook({
      payload: {
        id: "bf2c98d1-a163-4b8b-a49d-11b8e98046da",
        name: "5 Div S4 Lohko B",
        type: "roundRobin"
      }
    });

    await addChampionshipToDatabase(webhook);

    expect(mockInsertSeasonLeagueExternalId).toHaveBeenCalledWith(
      webhook.payload.id,
      webhook.payload.name,
      77,
      5,
      1,
      "roundRobin",
      2
    );
  });

  it("inserts with stage=1 for singleElimination (default stage)", async () => {
    const mockSeason = createMockSeason({
      id: 88,
      name: "S4",
      full_name: "Season 4",
      signup_start_date: new Date().toISOString().slice(0, 10),
      signup_end_date: new Date().toISOString().slice(0, 10),
      platform: SeasonPlatform.FACEIT,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: null
    });
    mockGetOrganizerFaceitSeasonForApp.mockResolvedValueOnce(mockSeason);

    mockGetSeasonLeagueBySeasonAndFaceitName.mockResolvedValueOnce({
      tier: 1,
      season_id: 88,
      league_id: 99
    });

    const webhook = buildWebhook({
      payload: {
        id: "ch-xyz",
        name: "Masters S4 Playoffs",
        type: "singleElimination"
      }
    });

    await addChampionshipToDatabase(webhook);

    expect(mockGetSeasonLeagueBySeasonAndFaceitName).toHaveBeenCalledWith(
      88,
      "Masters"
    );

    expect(mockInsertSeasonLeagueExternalId).toHaveBeenCalledWith(
      "ch-xyz",
      "Masters S4 Playoffs",
      88,
      99,
      1,
      "singleElimination",
      null
    );
  });
});
