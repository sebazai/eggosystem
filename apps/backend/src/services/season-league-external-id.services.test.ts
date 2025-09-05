import type { ChampionshipCreatedWebhook } from "@eggosystem/types";
import { SeasonPlatform } from "@eggosystem/types";
import { addChampionshipToDatabase } from "./season-league-external-id.services";
import { getOrganizerFaceitActiveSeasonForApp } from "../models/organizer.models";
import { getSeasonLeagueBySeasonAndFaceitName } from "../models/season-league.models";
import { insertSeasonLeagueExternalId } from "../models/season-league-external-id.models";

jest.mock("../models/organizer.models");
jest.mock("../models/season-league.models");
jest.mock("../models/season-league-external-id.models");

const mockGetOrganizerFaceitActiveSeasonForApp = jest.mocked(
  getOrganizerFaceitActiveSeasonForApp
);
const mockGetSeasonLeagueBySeasonAndFaceitName = jest.mocked(
  getSeasonLeagueBySeasonAndFaceitName
);
const mockInsertSeasonLeagueExternalId = jest.mocked(
  insertSeasonLeagueExternalId
);

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
    app_id: "app-1",
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

describe("addChampionshipToDatabase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws when no active organizer season exists", async () => {
    mockGetOrganizerFaceitActiveSeasonForApp.mockResolvedValueOnce(undefined);

    const webhook = buildWebhook();

    await expect(addChampionshipToDatabase(webhook)).rejects.toThrow(
      /No active organizer season found/
    );

    expect(mockGetOrganizerFaceitActiveSeasonForApp).toHaveBeenCalledWith(
      webhook.payload.organizer_id,
      730
    );
    expect(mockGetSeasonLeagueBySeasonAndFaceitName).not.toHaveBeenCalled();
    expect(mockInsertSeasonLeagueExternalId).not.toHaveBeenCalled();
  });

  it("throws when season league cannot be resolved from name prefix", async () => {
    mockGetOrganizerFaceitActiveSeasonForApp.mockResolvedValueOnce({
      id: 77,
      game_id: 1,
      name: "S4",
      full_name: "Season 4",
      signup_start_date: null,
      signup_end_date: null,
      platform: SeasonPlatform.FACEIT,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: null
    });

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

  it("inserts with stage=1 and isBO2PlayedAs2xBO1=true for roundRobin", async () => {
    mockGetOrganizerFaceitActiveSeasonForApp.mockResolvedValueOnce({
      id: 77,
      game_id: 1,
      name: "S4",
      full_name: "Season 4",
      signup_start_date: null,
      signup_end_date: null,
      platform: SeasonPlatform.FACEIT,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: null
    });

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
      2,
      true
    );
  });

  it("inserts with stage=2 and isBO2PlayedAs2xBO1=false for singleElimination", async () => {
    mockGetOrganizerFaceitActiveSeasonForApp.mockResolvedValueOnce({
      id: 88,
      game_id: 1,
      name: "S4",
      full_name: "Season 4",
      signup_start_date: null,
      signup_end_date: null,
      platform: SeasonPlatform.FACEIT,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: null
    });

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
      2,
      "singleElimination",
      null,
      false
    );
  });
});
