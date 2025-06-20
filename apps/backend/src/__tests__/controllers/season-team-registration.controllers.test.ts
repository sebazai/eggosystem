import * as seasonModels from "../../models/season.models";
import { addSignupForSeasonController } from "../../controllers/season-team-registration.controllers";
import * as db from "../../db/mysqlConnection";
import * as registrationModels from "../../models/season-team-registration.models";
// TODO: See todo below
// import * as rankModels from "../../models/season-player-ranks.models";
import * as teamServices from "../../services/team.services";
import * as teamModels from "../../models/team.models";
import * as organizationModels from "../../models/organization.models";
import * as seasonTeamRegistrationModels from "../../models/season-team-registration.models";
import * as seasonTeamRegistrationServices from "../../services/season-team-registration.services";
import * as seasonTeamPlayersModels from "../../models/season-team-players.models";
import type { Response } from "express";
import {
  type SignupFormValues,
  type RequestWithParamsAndBody,
  SeasonPlatform,
  type SeasonDetails
} from "@eggosystem/types";
import type { PoolConnection } from "mysql2/promise";
import _ from "lodash";
import { validSignupData } from "@eggosystem/shared-msw";
import { type BadRequestError } from "../../utils/errors";

describe("addSignupForSeason - database transaction testing", () => {
  let req: RequestWithParamsAndBody<{ season_id: string }, SignupFormValues>;
  let res: Response;
  const mockConnection = {
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
    execute: jest.fn().mockImplementation(() => {
      return [[], []];
    })
  };
  const now = new Date();
  const yesterday = new Date().setDate(now.getDate() - 1);
  const tomorrow = new Date().setDate(now.getDate() + 1);

  beforeEach(() => {
    req = {
      params: { season_id: "1" },
      body: _.cloneDeep(validSignupData)
    } as unknown as RequestWithParamsAndBody<
      { season_id: string },
      SignupFormValues
    >;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;
    jest
      .spyOn(db, "getConnection")
      .mockResolvedValue(mockConnection as unknown as PoolConnection);
    jest.spyOn(seasonModels, "getSeasonDetailsById").mockResolvedValue({
      id: 1,
      name: "Test Season",
      signup_start_date: String(yesterday),
      signup_end_date: String(tomorrow),
      platform: SeasonPlatform.FACEIT,
      game_id: 0,
      full_name: "CS2 Test Season",
      start_date: String(tomorrow),
      end_date: null,
      app_id: 730
    } satisfies SeasonDetails);
    jest
      .spyOn(seasonTeamRegistrationServices, "validatePlayersFromDBForSignup")
      .mockResolvedValue();
    jest
      .spyOn(teamModels, "getTeamWithIdWithoutOrg")
      .mockResolvedValue([undefined]);
  });

  it("should rollback and return 500 if an error occurs in transaction during handleSeasonTeamRegistration", async () => {
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(true));
    jest
      .spyOn(registrationModels, "insertSeasonTeamRegistration")
      .mockRejectedValue(new Error("DB Error"));

    try {
      await addSignupForSeasonController(req, res);
    } catch (_error) {
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
    }
  });

  it("should handle existing organization and existing team successfully", async () => {
    const signSpy = jest
      .spyOn(registrationModels, "insertSeasonTeamRegistration")
      .mockImplementation(() => Promise.resolve({ insertId: 2 }));
    const playersAddSpy = jest
      .spyOn(seasonTeamRegistrationServices, "addPlayersForTeamInSeason")
      .mockImplementation(() => Promise.resolve());
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(true));

    jest
      .spyOn(seasonTeamRegistrationServices, "setCaptainPermissionsForSeason")
      .mockResolvedValue();

    await addSignupForSeasonController(req, res);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();

    expect(signSpy).toHaveBeenCalledWith(
      1,
      2,
      {
        captain_steam_id: "12345678901234566",
        co_captain_steam_id: "12345678901234567",
        external_platform_id: "facded66-34dd-4a81-8a58-4d59c8b391d5",
        terms_and_conditions_approved: true
      },
      mockConnection
    );

    expect(playersAddSpy).toHaveBeenCalledWith(
      1,
      730,
      SeasonPlatform.FACEIT,
      2,
      req.body.players.map((player) => player.steamId),
      mockConnection
    );

    expect(mockConnection.commit).toHaveBeenCalled();
    expect(mockConnection.rollback).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ team_id: 2, organization_id: 102 });
  });

  it("insertSeasonTeamRegistration & insertSeasonTeamPlayer in addPlayersForTeamInSeason and it's subfunctions should be called with correct parameters", async () => {
    const insertSeasonTeamReg = jest
      .spyOn(seasonTeamRegistrationModels, "insertSeasonTeamRegistration")
      .mockResolvedValue({
        insertId: 1
      });
    const insertSeasonTeamPlayer = jest
      .spyOn(seasonTeamPlayersModels, "insertSeasonTeamPlayer")
      .mockResolvedValue({
        insertId: 1
      });

    jest
      .spyOn(seasonTeamRegistrationServices, "setCaptainPermissionsForSeason")
      .mockResolvedValue();

    // TODO: See todo below
    // const faceItRank = jest.spyOn(
    //   rankModels,
    //   "insertFaceITPlayerRankForSeason"
    // );
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(true));

    await addSignupForSeasonController(req, res);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(insertSeasonTeamReg).toHaveBeenCalledWith(
      1,
      2,
      {
        captain_steam_id: "12345678901234566",
        co_captain_steam_id: "12345678901234567",
        external_platform_id: "facded66-34dd-4a81-8a58-4d59c8b391d5",
        terms_and_conditions_approved: true
      },
      mockConnection
    );
    expect(insertSeasonTeamPlayer).toHaveBeenCalledWith(
      1,
      2,
      {
        steam_id: "12345678901234566"
      },
      mockConnection
    );

    expect(mockConnection.commit).toHaveBeenCalled();
    expect(mockConnection.rollback).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ team_id: 2, organization_id: 102 });
    // TODO: Figure out why these are not resetting/clearing, if we run this test with .only, these assertions work.
    // expect(faceItRank).toHaveBeenCalledTimes(5);
    // expect(insertSeasonTeamPlayer).toHaveBeenCalledTimes(5);
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
      .spyOn(registrationModels, "insertSeasonTeamRegistration")
      .mockImplementation(() => Promise.resolve({ insertId: 2 }));
    const playersAddSpy = jest
      .spyOn(seasonTeamRegistrationServices, "addPlayersForTeamInSeason")
      .mockImplementation(() => Promise.resolve());
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(true));

    jest
      .spyOn(seasonTeamRegistrationServices, "setCaptainPermissionsForSeason")
      .mockResolvedValue();

    jest.spyOn(teamModels, "insertTeam").mockResolvedValue({
      insertId: 666
    });
    jest.spyOn(organizationModels, "insertOrganization").mockResolvedValue({
      insertId: 1
    });

    await addSignupForSeasonController(req, res);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();

    expect(signSpy).toHaveBeenCalledWith(
      1,
      666,
      {
        captain_steam_id: "12345678901234566",
        co_captain_steam_id: "12345678901234567",
        external_platform_id: "facded66-34dd-4a81-8a58-4d59c8b391d5",
        terms_and_conditions_approved: true
      },
      mockConnection
    );

    expect(playersAddSpy).toHaveBeenCalledWith(
      1,
      730,
      SeasonPlatform.FACEIT,
      666,
      req.body.players.map((player) => player.steamId),
      mockConnection
    );

    expect(mockConnection.commit).toHaveBeenCalled();
    expect(mockConnection.rollback).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ team_id: 666, organization_id: 1 });
  });

  it("should handle existing organization and new team successfully", async () => {
    req.body.organizationId = 1;
    req.body.teamId = -1;
    req.body.newTeam = {
      name: "New Team"
    };
    const signSpy = jest
      .spyOn(registrationModels, "insertSeasonTeamRegistration")
      .mockImplementation(() => Promise.resolve({ insertId: 2 }));
    const playersAddSpy = jest
      .spyOn(seasonTeamRegistrationServices, "addPlayersForTeamInSeason")
      .mockImplementation(() => Promise.resolve());
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(true));
    jest
      .spyOn(seasonTeamRegistrationServices, "setCaptainPermissionsForSeason")
      .mockResolvedValue();

    jest.spyOn(teamModels, "insertTeam").mockResolvedValue({
      insertId: 1337
    } as unknown as { insertId: number });

    await addSignupForSeasonController(req, res);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();

    expect(signSpy).toHaveBeenCalledWith(
      1,
      1337,
      {
        captain_steam_id: "12345678901234566",
        co_captain_steam_id: "12345678901234567",
        external_platform_id: "facded66-34dd-4a81-8a58-4d59c8b391d5",
        terms_and_conditions_approved: true
      },
      mockConnection
    );

    expect(playersAddSpy).toHaveBeenCalledWith(
      1,
      730,
      SeasonPlatform.FACEIT,
      1337,
      req.body.players.map((player) => player.steamId),
      mockConnection
    );

    expect(mockConnection.commit).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      team_id: 1337,
      organization_id: 1
    });
  });
  it("should return error if team is not part of organization", async () => {
    req.body.organizationId = 1;
    req.body.teamId = 1;
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(false));

    jest
      .spyOn(seasonTeamRegistrationServices, "setCaptainPermissionsForSeason")
      .mockResolvedValue();

    try {
      await addSignupForSeasonController(req, res);
    } catch (error: unknown) {
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).not.toHaveBeenCalled();

      expect((error as BadRequestError).message).toEqual(
        "Team does not belong to the selected organization"
      );
    }
  });
});
