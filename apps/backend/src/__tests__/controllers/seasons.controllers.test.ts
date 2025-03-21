import request from "supertest";
import jwt from "jsonwebtoken";
import * as seasonModels from "../../models/season.models";
import { app } from "../../app";
import type TestAgent from "supertest/lib/agent";
import { addSignupForSeason } from "../../controllers/seasons.controllers";
import * as db from "../../db/mysqlConnection";
import * as signupServices from "../../services/signup.services";
import * as teamServices from "../../services/team.services";
import * as playerServices from "../../services/player.services";
import * as playerModels from "../../models/player.models";
import * as teamModels from "../../models/team.models";
import * as organizationModels from "../../models/organization.models";
import * as seasonTeamRegistrationModels from "../../models/seasonteamregistration.models";
import * as seasonTeamPlayersModels from "../../models/seasonteamplayers.models";
import type { Response } from "express";
import type {
  SignupFormValues,
  RequestWithParamsAndBody,
  Season,
  Player
} from "@eggosystem/types";
import type { PoolConnection } from "mysql2/promise";
import _ from "lodash";

const validSignupData = {
  organizationId: 1,
  teamId: 1,
  teamExternalId: "team-123",
  players: [
    {
      steam_id: "12345678901234567",
      name: "Player One",
      work_email: "pl***@example.com",
      discord: "playerOne#1234",
      captain: true
    },
    {
      steam_id: "12345678901234568",
      name: "Player Two",
      work_email: "player.two@example.com",
      discord: "playerTwo#1234",
      co_captain: true
    },
    {
      steam_id: "12345678901234569",
      name: "Player three",
      work_email: "player.three@example.com"
    },
    {
      steam_id: "12345678901234570",
      name: "Player Four",
      work_email: "player.four@example.com"
    },
    {
      steam_id: "12345678901234571",
      name: "Player Five",
      work_email: "player.five@example.com"
    }
  ]
};

const invalidSignupData = {
  organizationId: -1,
  teamId: -1,
  teamExternalId: "team-123",
  players: [
    {
      steam_id: "12345678901234567",
      name: "Player One",
      full_name: "Player One",
      work_email: "player.one@example.com",
      captain: true
    },
    {
      steam_id: "12345678901234568",
      name: "Player Two",
      work_email: "player.two@example.com",
      discord: "playerTwo#1234",
      co_captain: true
    },
    {
      steam_id: "12345678901234569",
      name: "Player three",
      work_email: "player.three@example.com"
    },
    {
      steam_id: "12345678901234570",
      name: "Player Four",
      work_email: "player.four@example.com"
    },
    {
      steam_id: "12345678901234571",
      name: "Player Five",
      work_email: "player.five@example.com"
    }
  ]
};

const JWT_SECRET = "your_jwt_secret";
let agent: TestAgent;

beforeAll(() => {
  // Generate a valid token before running any tests
  const accessToken = jwt.sign({ userId: "12345" }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "20m"
  });

  // Create a Supertest agent with default cookie set
  agent = request.agent(app);
  agent.set("Cookie", `access_token=${accessToken}`);
});

describe("POST /api/v1/seasons/:id/signup", () => {
  describe("with valid data", () => {
    it("should return 404 if season does not exist", async () => {
      jest.spyOn(seasonModels, "getSeasonById").mockResolvedValue([]);
      const res = await agent
        .post("/api/v1/seasons/123/signup")
        .send(validSignupData);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Season not found");
    });

    it("should return 400 if season has no signup start date", async () => {
      jest
        .spyOn(seasonModels, "getSeasonById")
        .mockResolvedValue([{ signup_start_date: null } as Season]);
      const res = await agent
        .post("/api/v1/seasons/123/signup")
        .send(validSignupData);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Season does not have a signup start date");
    });

    it("should return 400 if signup has not started yet", async () => {
      jest
        .spyOn(seasonModels, "getSeasonById")
        .mockResolvedValue([
          { signup_start_date: "2100-01-01T00:00:00Z" } as Season
        ]);
      const res = await agent
        .post("/api/v1/seasons/123/signup")
        .send(validSignupData);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Signup has not started yet");
    });

    it("should return 400 if signup has ended", async () => {
      jest.spyOn(seasonModels, "getSeasonById").mockResolvedValue([
        {
          signup_start_date: "2024-01-01T00:00:00Z",
          signup_end_date: "2024-01-02T00:00:00Z"
        } as Season
      ]);
      const res = await agent
        .post("/api/v1/seasons/123/signup")
        .send(validSignupData);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Signup has ended");
    });

    it("should return 400 if the signup form data is invalid", async () => {
      jest
        .spyOn(seasonModels, "getSeasonById")
        .mockResolvedValue([
          { signup_start_date: "2024-01-01T00:00:00Z" } as Season
        ]);
      const invalidData = { ...validSignupData, players: [] }; // Invalid: not enough players
      const res = await agent
        .post("/api/v1/seasons/123/signup")
        .send(invalidData);
      expect(res.status).toBe(400);
    });
  });

  // Custom Schema testing
  describe("with invalid data", () => {
    it("should return 400 if captain missing discord nick", async () => {
      jest
        .spyOn(seasonModels, "getSeasonById")
        .mockResolvedValue([
          { signup_start_date: "2024-01-01T00:00:00Z" } as Season
        ]);
      const res = await agent
        .post("/api/v1/seasons/123/signup")
        .send(invalidSignupData);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid signup form data");
      expect(res.body.errors.fieldErrors.players).toEqual([
        "Captains and co-captains must provide a Discord username."
      ]);
    });
    it("should return 400 if organizationId -1 and missing newOrganization", async () => {
      jest
        .spyOn(seasonModels, "getSeasonById")
        .mockResolvedValue([
          { signup_start_date: "2024-01-01T00:00:00Z" } as Season
        ]);
      const res = await agent
        .post("/api/v1/seasons/123/signup")
        .send(invalidSignupData);
      expect(res.status).toBe(400);

      expect(res.body.errors.fieldErrors.newOrganization).toEqual([
        "New organization details are required when 'Add new...' is selected."
      ]);
    });
    it("should return 400 if teamId -1 and missing newTeam", async () => {
      jest
        .spyOn(seasonModels, "getSeasonById")
        .mockResolvedValue([
          { signup_start_date: "2024-01-01T00:00:00Z" } as Season
        ]);
      const res = await agent
        .post("/api/v1/seasons/123/signup")
        .send(invalidSignupData);
      expect(res.status).toBe(400);

      expect(res.body.errors.fieldErrors.newTeam).toEqual([
        "New team details are required when 'Add new...' is selected."
      ]);
    });
    it("should return 400 if player full name incorrect and missing discord for captain", async () => {
      jest
        .spyOn(seasonModels, "getSeasonById")
        .mockResolvedValue([
          { signup_start_date: "2024-01-01T00:00:00Z" } as Season
        ]);
      invalidSignupData.players[0].full_name = "InvalidName";
      const res = await agent
        .post("/api/v1/seasons/123/signup")
        .send(invalidSignupData);
      expect(res.status).toBe(400);

      expect(res.body.errors.fieldErrors.players).toEqual([
        "Full name must contain a first name and a last name, separated by a space.",
        "Captains and co-captains must provide a Discord username."
      ]);
    });
    it("should return 400 if player email incorrect", async () => {
      jest
        .spyOn(seasonModels, "getSeasonById")
        .mockResolvedValue([
          { signup_start_date: "2024-01-01T00:00:00Z" } as Season
        ]);
      invalidSignupData.players[0].work_email = "invalid-email";
      const res = await agent
        .post("/api/v1/seasons/123/signup")
        .send(invalidSignupData);
      expect(res.status).toBe(400);
      expect(res.body.errors.fieldErrors.players).toContain(
        "Invalid email format."
      );
    });
    it("should return 400 if duplicate steam_id", async () => {
      jest
        .spyOn(seasonModels, "getSeasonById")
        .mockResolvedValue([
          { signup_start_date: "2024-01-01T00:00:00Z" } as Season
        ]);
      invalidSignupData.players[0].steam_id =
        invalidSignupData.players[1].steam_id;
      const res = await agent
        .post("/api/v1/seasons/123/signup")
        .send(invalidSignupData);
      expect(res.status).toBe(400);
      expect(res.body.errors.fieldErrors.players).toContain(
        "Each player must have a unique Steam ID."
      );
    });
  });
});

describe("addSignupForSeason - Try Catch Block", () => {
  let req: RequestWithParamsAndBody<{ id: string }, SignupFormValues>;
  let res: Response;
  const mockConnection = {
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
    execute: jest.fn()
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
    jest.spyOn(seasonModels, "getSeasonById").mockResolvedValue([
      {
        id: 1,
        name: "Test Season",
        signup_start_date: yesterday,
        signup_end_date: tomorrow
      } as unknown as Season
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should rollback and return 500 if an error occurs in transaction", async () => {
    jest
      .spyOn(signupServices, "signUpTeamForSeason")
      .mockRejectedValue(new Error("DB Error"));

    await addSignupForSeason(req, res);
    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(mockConnection.release).toHaveBeenCalled();
    expect(mockConnection.commit).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
  });

  it("should handle existing organization and existing team successfully", async () => {
    const signSpy = jest
      .spyOn(signupServices, "signUpTeamForSeason")
      .mockImplementation(() => Promise.resolve());
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(true));
    jest
      .spyOn(playerServices, "getFullPlayerDetails")
      .mockResolvedValue({} as unknown as Player);
    jest.spyOn(playerModels, "upsertPlayer").mockResolvedValue("1");

    await addSignupForSeason(req, res);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();

    expect(signSpy).toHaveBeenCalledWith(
      {
        seasonId: 1,
        teamId: 1,
        players: expect.any(Array),
        teamExternalId: "team-123",
        defects: undefined
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
    jest
      .spyOn(playerServices, "getFullPlayerDetails")
      .mockResolvedValue({} as unknown as Player);
    jest.spyOn(playerModels, "upsertPlayer").mockResolvedValue("1");

    await addSignupForSeason(req, res);
    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(insertSeasonTeamReg).toHaveBeenCalledWith(
      {
        season_id: 1,
        team_id: 1,
        captain_steam_id: "12345678901234567",
        co_captain_steam_id: "12345678901234568",
        external_platform_id: "team-123",
        defects: undefined
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
    jest
      .spyOn(playerServices, "getFullPlayerDetails")
      .mockResolvedValue({} as unknown as Player);
    jest.spyOn(playerModels, "upsertPlayer").mockResolvedValue("1");
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
        teamExternalId: "team-123",
        defects: undefined
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
    jest
      .spyOn(playerServices, "getFullPlayerDetails")
      .mockResolvedValue({} as unknown as Player);
    jest.spyOn(playerModels, "upsertPlayer").mockResolvedValue("1");
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
        teamExternalId: "team-123",
        defects: undefined
      },
      mockConnection
    );

    expect(mockConnection.commit).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ "Season signup": true });
  });
  it("should return error if team is not part of organization", async () => {
    req.body.organizationId = 1;
    req.body.teamId = 1;
    jest.spyOn(playerModels, "upsertPlayer").mockResolvedValue("1");
    jest
      .spyOn(playerServices, "getFullPlayerDetails")
      .mockResolvedValue({} as unknown as Player);
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
  it("should not call upsertPlayer if player exists, is not captain or co-captain and data is ok in db", async () => {
    req.body.players[0].work_email = "new.doe@example.com";
    req.body.players[0].captain = false;
    req.body.players[2].captain = true;
    req.body.players[2].discord = "Nakki";
    jest.spyOn(playerServices, "getFullPlayerDetails").mockResolvedValue({
      name: "JohnnyTheKiller",
      work_email: "john.doe@example.com",
      player_name: "John Doe"
    } as unknown as Player);
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(true));
    const players = jest
      .spyOn(playerModels, "upsertPlayer")
      .mockResolvedValue("1");
    await addSignupForSeason(req, res);
    expect(players).not.toHaveBeenCalledWith(
      {
        steam_id: req.body.players[0].steam_id
      },
      mockConnection
    );
  });
  it("should update discord for players that are captain or co-captain", async () => {
    jest
      .spyOn(playerServices, "getFullPlayerDetails")
      .mockResolvedValue({
        name: "JohnnyTheKiller",
        work_email: "john.doe@example.com",
        player_name: "John Doe"
      } as unknown as Player)
      .mockResolvedValue({
        name: "JaneTheSlayer",
        work_email: "jane.doe@example.com",
        player_name: "Jane Doe"
      } as unknown as Player);
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(true));
    const players = jest
      .spyOn(playerModels, "upsertPlayer")
      .mockResolvedValue("1");
    await addSignupForSeason(req, res);
    expect(players).toHaveBeenCalledWith(
      {
        steam_id: "12345678901234567",
        discord: "playerOne#1234"
      },
      mockConnection
    );
    expect(players).toHaveBeenCalledWith(
      {
        steam_id: "12345678901234568",
        discord: "playerTwo#1234"
      },
      mockConnection
    );
    expect(players).not.toHaveBeenCalledWith(
      {
        steam_id: "12345678901234569"
      },
      mockConnection
    );
  });

  it("should update email for player that has a bogus work_email in database", async () => {
    req.body.players[0].work_email = "new.doe@example.com";
    jest.spyOn(playerServices, "getFullPlayerDetails").mockResolvedValue({
      name: "JohnnyTheKiller",
      work_email: "hokkuspokkus",
      player_name: "John Doe"
    } as unknown as Player);
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(true));
    const players = jest
      .spyOn(playerModels, "upsertPlayer")
      .mockResolvedValue("1");
    await addSignupForSeason(req, res);
    expect(players).toHaveBeenCalledWith(
      {
        steam_id: "12345678901234567",
        work_email: "new.doe@example.com",
        discord: "playerOne#1234"
      },
      mockConnection
    );
  });
  it("should update email for player that has a null work_email in database", async () => {
    req.body.players[0].work_email = "new.doe@example.com";
    jest.spyOn(playerServices, "getFullPlayerDetails").mockResolvedValue({
      name: "JohnnyTheKiller",
      work_email: null,
      player_name: "John Doe"
    } as unknown as Player);
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(true));
    const players = jest
      .spyOn(playerModels, "upsertPlayer")
      .mockResolvedValue("1");
    await addSignupForSeason(req, res);
    expect(players).toHaveBeenCalledWith(
      {
        steam_id: "12345678901234567",
        work_email: "new.doe@example.com",
        discord: "playerOne#1234"
      },
      mockConnection
    );
  });
  it("Should update player_name in db if player_name is not valid", async () => {
    req.body.players[2].full_name = "Nakki Kauppias";
    jest.spyOn(playerServices, "getFullPlayerDetails").mockResolvedValue({
      name: "NakkiKauppias",
      work_email: "test.email@example.com",
      player_name: "Tero"
    } as unknown as Player);
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(true));
    const players = jest
      .spyOn(playerModels, "upsertPlayer")
      .mockResolvedValue("1");
    await addSignupForSeason(req, res);
    expect(players).toHaveBeenCalledWith(
      {
        steam_id: "12345678901234569",
        player_name: "Nakki Kauppias"
      },
      mockConnection
    );
  });
  it("Should update player_name in db if player_name is null", async () => {
    req.body.players[2].full_name = "Nakki Kauppias";
    jest.spyOn(playerServices, "getFullPlayerDetails").mockResolvedValue({
      name: "NakkiKauppias",
      work_email: "test.email@example.com",
      player_name: null
    } as unknown as Player);
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(true));
    const players = jest
      .spyOn(playerModels, "upsertPlayer")
      .mockResolvedValue("1");
    await addSignupForSeason(req, res);
    expect(players).toHaveBeenCalledWith(
      {
        steam_id: "12345678901234569",
        player_name: "Nakki Kauppias"
      },
      mockConnection
    );
  });
  it("should add new player to database if it does not exist", async () => {
    const signupData = {
      ..._.cloneDeep(validSignupData),
      players: [
        ..._.cloneDeep(validSignupData.players),
        {
          steam_id: "12345678901234572",
          name: "Player6",
          work_email: "playerSix@gmail.com",
          discord: "playerSix#1234",
          captain: false,
          co_captain: true,
          full_name: "Player Six"
        }
      ]
    };
    signupData.players[1].co_captain = false;
    req.body = signupData;
    const upsert = jest
      .spyOn(playerModels, "upsertPlayer")
      .mockResolvedValue("1");
    jest
      .spyOn(teamServices, "isTeamPartOfOrganization")
      .mockImplementation(() => Promise.resolve(true));
    jest
      .spyOn(playerServices, "getFullPlayerDetails")
      .mockImplementation((steam_id) => {
        if (steam_id === "12345678901234572") {
          return Promise.resolve(undefined);
        }
        return Promise.resolve({
          name: "NakkiKauppias",
          discord: "Nakki#1234",
          work_email: "test.email@example.com",
          player_name: "Tero Nero"
        } as unknown as Player);
      });
    await addSignupForSeason(req, res);
    expect(upsert).toHaveBeenCalledWith(
      {
        discord: "playerSix#1234",
        name: "Player6",
        player_name: "Player Six",
        steam_id: "12345678901234572",
        work_email: "playerSix@gmail.com"
      },
      mockConnection
    );
  });
});
