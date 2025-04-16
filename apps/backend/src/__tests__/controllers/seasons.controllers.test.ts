import * as seasonModels from "../../models/season.models";
import { addSignupForSeason } from "../../controllers/seasons.controllers";
import * as db from "../../db/mysqlConnection";
import * as signupServices from "../../services/signup.services";
import * as teamServices from "../../services/team.services";
import * as steamServices from "../../services/steam.services";
import * as teamModels from "../../models/team.models";
import * as organizationModels from "../../models/organization.models";
import * as seasonTeamRegistrationModels from "../../models/seasonteamregistration.models";
import * as seasonTeamPlayersModels from "../../models/seasonteamplayers.models";
import type { Response } from "express";
import {
  type SignupFormValues,
  type RequestWithParamsAndBody,
  type Season,
  SeasonPlatform
} from "@eggosystem/types";
import type { PoolConnection } from "mysql2/promise";
import _ from "lodash";

const validSignupData = {
  organizationId: 1,
  teamId: 1,
  teamExternalId: "team-123",
  players: [
    {
      account_id: 1,
      steam_id: "12345678901234567",
      nickname: "Player One",
      discord: "playerOne#1234",
      captain: true
    },
    {
      account_id: 2,
      steam_id: "12345678901234568",
      nickname: "Player Two",
      discord: "playerTwo#1234",
      co_captain: true
    },
    {
      account_id: 3,
      steam_id: "12345678901234569",
      nickname: "Player three"
    },
    {
      account_id: 4,
      steam_id: "12345678901234570",
      nickname: "Player Four"
    },
    {
      account_id: 5,
      steam_id: "12345678901234571",
      nickname: "Player Five"
    }
  ]
};

describe("addSignupForSeason - Try Catch Block", () => {
  let req: RequestWithParamsAndBody<{ id: string }, SignupFormValues>;
  let res: Response;
  const mockConnection = {
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
    execute: jest.fn().mockImplementation(() => [{}])
  };
  const now = new Date();
  const yesterday = new Date().setDate(now.getDate() - 1);
  const tomorrow = new Date().setDate(now.getDate() + 1);

  beforeEach(() => {
    jest.restoreAllMocks();
    req = {
      params: { id: "1" },
      body: _.cloneDeep(validSignupData)
    } as unknown as RequestWithParamsAndBody<{ id: string }, SignupFormValues>;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;
    jest
      .spyOn(db, "getConnection")
      .mockResolvedValue(mockConnection as unknown as PoolConnection);
    jest.spyOn(seasonModels, "getSeasonById").mockResolvedValue({
      id: 1,
      name: "Test Season",
      signup_start_date: String(yesterday),
      signup_end_date: String(tomorrow),
      platform: SeasonPlatform.Kanaliiga,
      game_id: 0,
      full_name: "CS2 Test Season",
      start_date: "String(tomorrow)",
      end_date: null
    } satisfies Season);
    jest
      .spyOn(steamServices, "areSteamProfilesPublic")
      .mockResolvedValue({ is_all_public: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should rollback and return 500 if an error occurs in transaction", async () => {
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(true));
    jest
      .spyOn(signupServices, "signUpTeamForSeason")
      .mockRejectedValue(new Error("DB Error"));

    try {
      await addSignupForSeason(req, res);
    } catch (_error) {
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
    }
  });

  it("should handle existing organization and existing team successfully", async () => {
    const signSpy = jest
      .spyOn(signupServices, "signUpTeamForSeason")
      .mockImplementation(() => Promise.resolve());
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(true));

    await addSignupForSeason(req, res);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();

    expect(signSpy).toHaveBeenCalledWith(
      {
        seasonId: 1,
        teamId: 1,
        players: expect.any(Array),
        teamExternalId: "team-123"
      },
      mockConnection
    );

    expect(mockConnection.commit).toHaveBeenCalled();
    expect(mockConnection.rollback).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ "Season signup": true });
  });

  it("insertSeasonTeamRegistration & insertSeasonTeamPlayer should be called with correct parameters", async () => {
    const insertSeasonTeamReg = jest
      .spyOn(seasonTeamRegistrationModels, "insertSeasonTeamRegistration")
      .mockResolvedValue({
        insertId: 1
      } as unknown as { insertId: number });
    const insertSeasonTeamPlayer = jest
      .spyOn(seasonTeamPlayersModels, "insertSeasonTeamPlayer")
      .mockResolvedValue({
        insertId: 1
      } as unknown as { insertId: number });
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(true));

    await addSignupForSeason(req, res);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(insertSeasonTeamReg).toHaveBeenCalledWith(
      {
        season_id: 1,
        team_id: 1,
        captain_steam_id: "12345678901234567",
        co_captain_steam_id: "12345678901234568",
        external_platform_id: "team-123"
      },
      mockConnection
    );
    expect(insertSeasonTeamPlayer).toHaveBeenCalledWith(
      {
        season_id: 1,
        team_id: 1,
        steam_id: "12345678901234567"
      },
      mockConnection
    );
    expect(insertSeasonTeamPlayer).toHaveBeenCalledTimes(5);
    expect(mockConnection.commit).toHaveBeenCalled();
    expect(mockConnection.rollback).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ "Season signup": true });
  });

  it("should handle new organization and new team successfully", async () => {
    req.body.organizationId = -1;
    req.body.teamId = -1;
    req.body.newTeam = {
      name: "New Team"
    };
    req.body.newOrganization = {
      name: "New Organization",
      organization_code: "new-org-code",
      website: "https://new-organization.com"
    };
    const signSpy = jest
      .spyOn(signupServices, "signUpTeamForSeason")
      .mockImplementation(() => Promise.resolve());
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(true));

    jest.spyOn(teamModels, "insertTeam").mockResolvedValue({
      insertId: 666
    } as unknown as { insertId: number });
    jest.spyOn(organizationModels, "insertOrganization").mockResolvedValue({
      insertId: 1
    } as unknown as { insertId: number });

    await addSignupForSeason(req, res);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();

    expect(signSpy).toHaveBeenCalledWith(
      {
        seasonId: 1,
        teamId: 666,
        players: expect.any(Array),
        teamExternalId: "team-123"
      },
      mockConnection
    );

    expect(mockConnection.commit).toHaveBeenCalled();
    expect(mockConnection.rollback).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ "Season signup": true });
  });

  it("should handle existing organization and new team successfully", async () => {
    req.body.organizationId = 1;
    req.body.teamId = -1;
    req.body.newTeam = {
      name: "New Team"
    };
    const signSpy = jest
      .spyOn(signupServices, "signUpTeamForSeason")
      .mockImplementation(() => Promise.resolve());
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(true));

    jest.spyOn(teamModels, "insertTeam").mockResolvedValue({
      insertId: 1337
    } as unknown as { insertId: number });

    await addSignupForSeason(req, res);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();

    expect(signSpy).toHaveBeenCalledWith(
      {
        seasonId: 1,
        teamId: 1337,
        players: expect.any(Array),
        teamExternalId: "team-123"
      },
      mockConnection
    );

    expect(mockConnection.commit).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ "Season signup": true });
  });
  it("should return error if team is not part of organization", async () => {
    req.body.organizationId = 1;
    req.body.teamId = 1;
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(false));

    await addSignupForSeason(req, res);
    expect(mockConnection.release).toHaveBeenCalled();
    expect(mockConnection.commit).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Team does not belong to the selected organization"
    });
  });
});
