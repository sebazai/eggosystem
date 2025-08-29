/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type Account,
  type InsertSeason,
  type InsertSeasonTeamRegistration,
  type SeasonDetails,
  SeasonPlatform,
  type SeasonPlayerRank,
  type SignupNewOrganizationType,
  type SignupNewTeamType,
  type SteamPlayer,
  type Team,
  type UpdateSeasonTeamRegistration
} from "@eggosystem/types";
import {
  cleanUpTestUser,
  cleanupTestUsers,
  clearOrganization,
  clearRogueTeam,
  clearSeasonPlayerRanks,
  insertOneTestUser,
  insertRogueTeam,
  insertTestSeason,
  insertTestUsersForSignup,
  removeTestOrg,
  removeTestSeason,
  removeTestTeam,
  setSeasonTeamPlayer,
  setSeasonTeamPlayers,
  setSeasonTeamRegistration,
  unsetSeasonTeamRegistration
} from "../__utils__/seed-database";
import * as registrationServices from "./season-team-registration.services";
import * as organizationModels from "../models/organization.models";
import * as registrationModels from "../models/season-team-registration.models";
import * as teamModels from "../models/team.models";
import _ from "lodash";
import { validSignupData } from "@eggosystem/shared-msw";
import { type BadRequestError } from "../utils/errors";
import { runQuery } from "../db/mysqlRunQuery";
import { redisClient } from "../utils/redisClient";
import { faceitEloToLevel } from "../utils/faceit-utils";

describe("Season team registration services", () => {
  process.env.PRIVACY_POLICY_VERSION = "1";
  const now = new Date();
  const yesterday = new Date().setDate(now.getDate() - 1);
  const tomorrow = new Date().setDate(now.getDate() + 1);
  const insertSeason = {
    id: 1,
    game_id: 1,
    name: "Test Season",
    full_name: "CS2 Test Season",
    signup_start_date: new Date(yesterday),
    signup_end_date: new Date(tomorrow),
    platform: SeasonPlatform.FACEIT,
    start_date: new Date(tomorrow),
    end_date: null
  } satisfies InsertSeason;
  const seasonDetails = {
    ...insertSeason,
    signup_start_date: insertSeason.signup_start_date.toDateString(),
    signup_end_date: insertSeason.signup_end_date.toDateString(),
    start_date: insertSeason.start_date.toDateString(),
    app_id: 730
  } satisfies SeasonDetails;

  beforeAll(async () => {
    await insertTestSeason(insertSeason);
    await insertTestUsersForSignup();
  });
  afterAll(async () => {
    await removeTestSeason(1);
    await cleanupTestUsers();
  });
  describe("handleSignupFormForSeason", () => {
    beforeEach(() => {
      jest
        .spyOn(registrationServices, "handleSeasonTeamRegistration")
        .mockResolvedValue();
    });
    it("Should throw error if captain not in form data", async () => {
      const formData = _.cloneDeep(validSignupData);
      formData.players[0].captain = false;
      try {
        await registrationServices.handleSignupFormForSeason(
          seasonDetails,
          formData
        );
      } catch (err) {
        const asBadReq = err as BadRequestError;
        expect(asBadReq.message).toEqual("Could not determine captain.");
        expect(asBadReq.status).toEqual(400);
      }
    });
    it("Should throw error if co-captain not in form data", async () => {
      const formData = _.cloneDeep(validSignupData);
      formData.players[1].coCaptain = false;
      try {
        await registrationServices.handleSignupFormForSeason(
          seasonDetails,
          formData
        );
      } catch (err) {
        const asBadReq = err as BadRequestError;
        expect(asBadReq.message).toEqual("Could not determine co-captain.");
        expect(asBadReq.status).toEqual(400);
      }
    });
    it("Should throw error with bogus orgId and teamId", async () => {
      const formData = _.cloneDeep(validSignupData);
      formData.organizationId = -2;
      formData.teamId = -2;
      try {
        await registrationServices.handleSignupFormForSeason(
          seasonDetails,
          formData
        );
      } catch (err) {
        const asBadReq = err as BadRequestError;
        expect(asBadReq.message).toEqual(
          "Failed to add registration, could not determine team or organization."
        );
        expect(asBadReq.status).toEqual(400);
      }
    });
    describe("new org and new team", () => {
      it("Should throw error if trying to create a new organization for existing team", async () => {
        const formData = _.cloneDeep(validSignupData);
        formData.organizationId = -1;
        formData.teamId = 2;
        try {
          await registrationServices.handleSignupFormForSeason(
            seasonDetails,
            formData
          );
        } catch (err) {
          const asBadReq = err as BadRequestError;
          expect(asBadReq.message).toEqual(
            "Cannot create a new organization with an existing team"
          );
          expect(asBadReq.status).toEqual(400);
        }
      });
      it("Should add new organization and new team as org_approved true", async () => {
        const formData = _.cloneDeep(validSignupData);
        formData.organizationId = -1;
        formData.teamId = -1;
        formData.newOrganization = {
          name: "Test Org",
          organization_code: "12345678-9",
          website: "http://kanaliiga.org"
        } satisfies SignupNewOrganizationType;
        formData.newTeam = {
          name: "TestiBoyz"
        } satisfies SignupNewTeamType;
        const orgInsertSpy = jest.spyOn(
          organizationModels,
          "insertOrganization"
        );
        const teamInsertSpy = jest.spyOn(teamModels, "insertTeam");

        let data: any;

        try {
          data = await registrationServices.handleSignupFormForSeason(
            seasonDetails,
            formData
          );

          expect(data).toHaveProperty("organization_id");
          expect(data).toHaveProperty("team_id");
          expect(orgInsertSpy).toHaveBeenCalledTimes(1);
          expect(teamInsertSpy).toHaveBeenCalledTimes(1);
          expect(typeof data.organization_id).toBe("number");
          expect(typeof data.team_id).toBe("number");
          const [fromDb] = await runQuery<[Team]>(
            "SELECT * FROM Teams WHERE id = ?",
            [data.team_id]
          );
          expect(fromDb.org_approved).toEqual(true);
        } finally {
          if (data?.team_id) {
            await removeTestTeam(data.team_id);
          }
          if (data?.organization_id) {
            await removeTestOrg(data.organization_id);
          }
        }
      });
    });
    describe("existing org and new team", () => {
      it("Should not add new org", async () => {
        const formData = _.cloneDeep(validSignupData);
        formData.organizationId = 1;
        formData.teamId = -1;
        formData.newTeam = {
          name: "TestiBoyz2"
        } satisfies SignupNewTeamType;
        const orgInsertSpy = jest.spyOn(
          organizationModels,
          "insertOrganization"
        );
        const teamInsertSpy = jest.spyOn(teamModels, "insertTeam");

        let data: any;
        try {
          data = await registrationServices.handleSignupFormForSeason(
            seasonDetails,
            formData
          );
          expect(data).toHaveProperty("organization_id");
          expect(data).toHaveProperty("team_id");
          expect(data.organization_id).toEqual(1);
          expect(typeof data.team_id).toBe("number");
          expect(orgInsertSpy).not.toHaveBeenCalled();
          expect(teamInsertSpy).toHaveBeenCalledTimes(1);
          const [fromDb] = await runQuery<[Team]>(
            "SELECT * FROM Teams WHERE id = ?",
            [data.team_id]
          );
          expect(fromDb.org_approved).toEqual(false);
        } finally {
          if (data?.team_id) {
            await removeTestTeam(data.team_id);
          }
        }
      });
    });
    describe("existing org and existing team", () => {
      it("Should throw error if team not part of organization", async () => {
        const formData = _.cloneDeep(validSignupData);
        formData.organizationId = 1;
        formData.teamId = 2;
        try {
          await registrationServices.handleSignupFormForSeason(
            seasonDetails,
            formData
          );
        } catch (error) {
          const errAsBadReq = error as BadRequestError;
          expect(errAsBadReq.message).toEqual(
            "Team does not belong to the selected organization"
          );
          expect(errAsBadReq.status).toEqual(400);
        }
      });
    });
    describe("org and rogue team", () => {
      let team: { insertId: number };
      let orgToClear: number | undefined;
      beforeEach(async () => {
        team = await insertRogueTeam();
      });
      afterEach(async () => {
        await clearRogueTeam();
        await clearOrganization(orgToClear);
      });
      it("Should add the rogue team to existing org with org_approved false", async () => {
        const formData = _.cloneDeep(validSignupData);
        formData.organizationId = 1;
        formData.teamId = team.insertId;
        await registrationServices.handleSignupFormForSeason(
          seasonDetails,
          formData
        );
        const [updatedTeam] = await runQuery<Array<Team>>(
          "SELECT * FROM Teams WHERE id = ?",
          [team.insertId]
        );
        expect(updatedTeam.organization_id).toEqual(1);
        expect(updatedTeam.org_approved).toEqual(false);
      });
      it("Should add the rogue team to new org with org_approved false", async () => {
        const formData = _.cloneDeep(validSignupData);
        formData.organizationId = -1;
        formData.newOrganization = {
          name: "Heppa",
          organization_code: "1234567-9",
          website: "https://kanaliiga.org"
        };
        formData.teamId = team.insertId;
        await registrationServices.handleSignupFormForSeason(
          seasonDetails,
          formData
        );
        const [updatedTeam] = await runQuery<Array<Team>>(
          "SELECT * FROM Teams WHERE id = ?",
          [team.insertId]
        );
        const [lastInsertId] = await runQuery<
          Array<{ "LAST_INSERT_ID()": number }>
        >("SELECT LAST_INSERT_ID();");
        orgToClear = lastInsertId["LAST_INSERT_ID()"];

        expect(updatedTeam.organization_id).toEqual(orgToClear);
        expect(updatedTeam.org_approved).toEqual(false);
      });
    });
  });
  describe("handleSeasonTeamRegistration", () => {
    afterEach(async () => {
      await runQuery(
        "DELETE FROM SeasonTeamRegistrations WHERE season_id = ? AND team_id = ?",
        [seasonDetails.id, validSignupData.teamId]
      );
    });
    it("happy path - have called all functions with valid data and does not return error", async () => {
      const formData = _.cloneDeep(validSignupData);
      const validatePlayersInDb = jest
        .spyOn(registrationServices, "validatePlayersFromDBForSignup")
        .mockResolvedValue();
      const registrationInsert = jest
        .spyOn(registrationModels, "insertSeasonTeamRegistration")
        .mockResolvedValue({ insertId: 1 });
      const addPlayers = jest
        .spyOn(registrationServices, "addPlayersForTeamInSeason")
        .mockResolvedValue();
      // Captain permissions are now handled automatically by database triggers

      await registrationServices.handleSeasonTeamRegistration(
        seasonDetails.id,
        seasonDetails.platform,
        seasonDetails.app_id,
        formData.teamId,
        formData.organizationId,
        {
          external_platform_id: formData.teamExternalId,
          terms_and_conditions_approved:
            formData.captainHasReadTermAndConditions
        } satisfies InsertSeasonTeamRegistration,
        formData.players.map((player) => ({
          steam_id: player.steamId,
          is_captain: Boolean(player.captain),
          is_co_captain: Boolean(player.coCaptain)
        }))
      );
      expect(validatePlayersInDb).toHaveBeenCalledWith(
        seasonDetails.id,
        formData.teamId,
        formData.organizationId,
        formData.players.map((player) => player.steamId)
      );
      expect(registrationInsert).toHaveBeenCalledWith(
        seasonDetails.id,
        formData.teamId,
        {
          external_platform_id: formData.teamExternalId,
          terms_and_conditions_approved: true
        } satisfies InsertSeasonTeamRegistration,
        undefined
      );
      expect(addPlayers).toHaveBeenCalledWith(
        seasonDetails.id,
        seasonDetails.app_id,
        seasonDetails.platform,
        formData.teamId,
        formData.players.map((player) => ({
          steam_id: player.steamId,
          is_captain: Boolean(player.captain),
          is_co_captain: Boolean(player.coCaptain)
        })),
        undefined
      );
      // Captain permissions are now handled automatically by database triggers
    });
  });
  describe("validatePlayersFromDBForSignup", () => {
    describe("approved by organizer", () => {
      beforeEach(async () => {
        const formData = _.cloneDeep(validSignupData);

        const query = `
          INSERT INTO SeasonPlayerApprovals (season_id, team_id, steam_id, approved_by_id, ticket_id, details)
          VALUES (?, ?, ?, ?, ?, ?)
      `;
        await runQuery(query, [
          1,
          formData.teamId,
          formData.players[2].steamId,
          1,
          null,
          null
        ]);
        await runQuery(query, [
          1,
          formData.teamId,
          formData.players[1].steamId,
          1,
          null,
          null
        ]);
      });

      afterEach(async () => {
        await cleanupTestUsers();
        await insertTestUsersForSignup();
      });

      it("Should pass if user has work e-mail, it is marked as personal, it has been verified, and organizer has approved him.", async () => {
        const formData = _.cloneDeep(validSignupData);

        await runQuery(
          "UPDATE Accounts SET is_work_email_personal_email = ? WHERE id = ?",
          [true, formData.players[1].accountId]
        );

        await registrationServices.validatePlayersFromDBForSignup(
          seasonDetails.id,
          formData.teamId,
          formData.organizationId,
          formData.players.map((player) => player.steamId)
        );
      });
      it("Should fail if NULL work e-mail in profile and manually approved by organizer", async () => {
        try {
          const formData = _.cloneDeep(validSignupData);
          await runQuery("UPDATE Accounts SET work_email = ? WHERE id = ?", [
            null,
            formData.players[2].accountId
          ]);

          await registrationServices.validatePlayersFromDBForSignup(
            seasonDetails.id,
            formData.teamId,
            formData.organizationId,
            formData.players.map((player) => player.steamId)
          );
        } catch (error) {
          const err = error as BadRequestError;
          expect(err.message).toEqual(
            "Player 12345678901234568 does not have valid work e-mail and has not been approved by organizer. Contact the organizer in Discord."
          );
        }
      });
    });
    describe("others", () => {
      afterEach(async () => {
        await cleanupTestUsers();
        await insertTestUsersForSignup();
      });

      it("should fail if a player steam id in form is not present in database", async () => {
        const steamIdToRemove = validSignupData.players[3].steamId;
        const formData = _.cloneDeep(validSignupData);
        await runQuery("DELETE FROM SteamPlayers WHERE steam_id = ?", [
          steamIdToRemove
        ]);
        try {
          await registrationServices.validatePlayersFromDBForSignup(
            seasonDetails.id,
            formData.teamId,
            formData.organizationId,
            formData.players.map((player) => player.steamId)
          );
        } catch (error) {
          const badReqError = error as BadRequestError;
          expect(badReqError.message).toEqual(
            "Could not find players in database that is provided in the form"
          );
        }
      });
      it("Should fail if profiles are not public", async () => {
        const formData = _.cloneDeep(validSignupData);
        try {
          await registrationServices.validatePlayersFromDBForSignup(
            seasonDetails.id,
            formData.teamId,
            formData.organizationId,
            formData.players.map((player) => player.steamId)
          );
        } catch (error) {
          const asBadreq = error as BadRequestError;
          expect(asBadreq.message).toEqual(
            "Steam IDs 12345678901234569, 12345678901234570 are not public."
          );
        }
      });
      it("Should fail if not accepted privacy policy", async () => {
        const formData = _.cloneDeep(validSignupData);
        await runQuery(
          "UPDATE UserPolicyAcceptances SET accepted_privacy_policy = ? WHERE account_id = ?",
          [false, formData.players[4].accountId]
        );
        try {
          await registrationServices.validatePlayersFromDBForSignup(
            seasonDetails.id,
            formData.teamId,
            formData.organizationId,
            formData.players.map((player) => player.steamId)
          );
        } catch (error) {
          const asBadreq = error as BadRequestError;
          expect(asBadreq.message).toEqual(
            "Player 12345678901234570 has not accepted privacy policy."
          );
        }
      });
      it("Should fail if user has no work e-mail and has not been approved by organizer", async () => {
        const formData = _.cloneDeep(validSignupData);
        await runQuery("UPDATE Accounts SET work_email = ? WHERE id = ?", [
          null,
          formData.players[3].accountId
        ]);
        try {
          await registrationServices.validatePlayersFromDBForSignup(
            seasonDetails.id,
            formData.teamId,
            formData.organizationId,
            formData.players.map((player) => player.steamId)
          );
        } catch (error) {
          const asBadreq = error as BadRequestError;
          expect(asBadreq.message).toEqual(
            "Player 12345678901234569 does not have valid work e-mail and has not been approved by organizer. Contact the organizer in Discord."
          );
        }
      });
      it("Should fail if user has work e-mail, and it has not been verified nor been approved by organizer", async () => {
        const formData = _.cloneDeep(validSignupData);
        await runQuery(
          "UPDATE Accounts SET work_email_verified = ? WHERE id = ?",
          [false, formData.players[2].accountId]
        );
        try {
          await registrationServices.validatePlayersFromDBForSignup(
            seasonDetails.id,
            formData.teamId,
            formData.organizationId,
            formData.players.map((player) => player.steamId)
          );
        } catch (error) {
          const asBadreq = error as BadRequestError;
          expect(asBadreq.message).toEqual(
            "Player 12345678901234568 has not verified e-mail their e-mail."
          );
        }
      });
      it("Should pass if user has work e-mail, and it has been verified", async () => {
        const formData = _.cloneDeep(validSignupData);

        await registrationServices.validatePlayersFromDBForSignup(
          seasonDetails.id,
          formData.teamId,
          formData.organizationId,
          formData.players.map((player) => player.steamId)
        );
      });
      it("Should not pass if user has work e-mail, it is marked as personal, it has been verified.", async () => {
        const formData = _.cloneDeep(validSignupData);
        await runQuery(
          "UPDATE Accounts SET is_work_email_personal_email = ? WHERE id = ?",
          [true, formData.players[3].accountId]
        );

        try {
          await registrationServices.validatePlayersFromDBForSignup(
            seasonDetails.id,
            formData.teamId,
            formData.organizationId,
            formData.players.map((player) => player.steamId)
          );
        } catch (error) {
          const asBadreq = error as BadRequestError;
          expect(asBadreq.message).toEqual(
            "Player 12345678901234569 does not have valid work e-mail and has not been approved by organizer. Contact the organizer in Discord."
          );
        }
      });
      it("Should fail if no full_name in profile", async () => {
        const formData = _.cloneDeep(validSignupData);
        await runQuery("UPDATE Accounts SET full_name = ? WHERE id = ?", [
          null,
          formData.players[2].accountId
        ]);
        try {
          await registrationServices.validatePlayersFromDBForSignup(
            seasonDetails.id,
            formData.teamId,
            formData.organizationId,
            formData.players.map((player) => player.steamId)
          );
        } catch (error) {
          const asBadreq = error as BadRequestError;
          expect(asBadreq.message).toEqual(
            "Player 12345678901234568 profile data missing."
          );
        }
      });
    });
  });
  describe("addPlayersForTeamInSeason", () => {
    beforeEach(async () => {
      await unsetSeasonTeamRegistration();
      await setSeasonTeamRegistration();
      await clearSeasonPlayerRanks();
      await insertOneTestUser(9999111, "11111111111111111", "App Ranker");
      await insertOneTestUser(9999112, "11111111111111112", "Faceit Ranker");
      await insertOneTestUser(9999113, "11111111111111113", "No Ranker");
      await insertOneTestUser(9999114, "11111111111111114", "CSGO Ranker");
    });
    afterEach(async () => {
      await cleanUpTestUser(9999111);
      await cleanUpTestUser(9999112);
      await cleanUpTestUser(9999113);
      await cleanUpTestUser(9999114);
    });
    it("should fail if a player is missing hours for app_id", async () => {
      const formData = _.cloneDeep(validSignupData);
      try {
        await registrationServices.addPlayersForTeamInSeason(
          seasonDetails.id,
          seasonDetails.app_id,
          seasonDetails.platform,
          formData.teamId,
          formData.players.map((player) => ({
            steam_id: player.steamId,
            is_captain: Boolean(player.captain),
            is_co_captain: Boolean(player.coCaptain)
          }))
        );
      } catch (error) {
        const asBadreq = error as BadRequestError;
        expect(asBadreq.message).toEqual(
          "Player 12345678901234566 hours not found."
        );
      }
    });
    it("should fail if a player is missing either external rank or app id rank", async () => {
      const formData = _.cloneDeep(validSignupData);
      try {
        await registrationServices.addPlayersForTeamInSeason(
          seasonDetails.id,
          seasonDetails.app_id,
          seasonDetails.platform,
          formData.teamId,
          formData.players.map((player) => ({
            steam_id: player.steamId,
            is_captain: Boolean(player.captain),
            is_co_captain: Boolean(player.coCaptain)
          }))
        );
      } catch (error) {
        const asBadreq = error as BadRequestError;
        expect(asBadreq.message).toEqual(
          "Player 12345678901234566 has no app id rank or faceit rank."
        );
      }
    });
    it("Should pass with average app rank within the last year, and external platform rank not present", async () => {
      const formData = _.cloneDeep(validSignupData);
      formData.players.push({
        steamId: "11111111111111111",
        accountId: 999111,
        nickname: "App Ranker"
      });

      await registrationServices.addPlayersForTeamInSeason(
        seasonDetails.id,
        seasonDetails.app_id,
        seasonDetails.platform,
        formData.teamId,
        formData.players.map((player) => ({
          steam_id: player.steamId,
          is_captain: Boolean(player.captain),
          is_co_captain: Boolean(player.coCaptain)
        }))
      );
      const [rankForSeason] = await runQuery<[SeasonPlayerRank]>(
        "SELECT * FROM SeasonPlayerRanks WHERE steam_id = ? AND season_id = ?",
        [formData.players[5].steamId, seasonDetails.id]
      );
      expect(rankForSeason.cs2_rank).toEqual(22000);
      expect(rankForSeason.cs_hours).toEqual(112);
      expect(rankForSeason.faceit_elo).toEqual(750);
      expect(rankForSeason.faceit_level).toEqual(2);
      expect(rankForSeason.faceit_kd).toEqual(0.95);
      // 6 times for app id rank, 6 times for hours, 6 times for external rank
      expect(redisClient.get as jest.Mock).toHaveBeenCalledTimes(18);
    });
    it("Should throw error if no rank and no external rank", async () => {
      const formData = _.cloneDeep(validSignupData);

      try {
        await registrationServices.addPlayersForTeamInSeason(
          seasonDetails.id,
          seasonDetails.app_id,
          SeasonPlatform.FACEIT,
          formData.teamId,
          formData.players.map((player) => ({
            steam_id: player.steamId,
            is_captain: Boolean(player.captain),
            is_co_captain: Boolean(player.coCaptain)
          }))
        );
      } catch (error) {
        const errorAsBadReq = error as BadRequestError;
        expect(errorAsBadReq.message).toEqual(
          "Player 12345678901234570 has no app id rank or faceit rank."
        );
      }
    });
    it("Should not pass if external platform rank is present but app rank not", async () => {
      const formData = _.cloneDeep(validSignupData);
      formData.players.push({
        steamId: "11111111111111112",
        accountId: 9999112,
        nickname: "Faceit Ranker"
      });

      try {
        await registrationServices.addPlayersForTeamInSeason(
          seasonDetails.id,
          seasonDetails.app_id,
          SeasonPlatform.FACEIT,
          formData.teamId,
          formData.players.map((player) => ({
            steam_id: player.steamId,
            is_captain: Boolean(player.captain),
            is_co_captain: Boolean(player.coCaptain)
          }))
        );
      } catch (error) {
        const errorAsBadReq = error as BadRequestError;
        expect(errorAsBadReq.message).toEqual(
          "Player 11111111111111112 has no app id rank"
        );
      }
    });
    it("Should pass when rank is has been added manually by organizer into database, but hours come from steam and faceit rank from faceit", async () => {
      const formData = _.cloneDeep(validSignupData);
      const idToRemove = await runQuery<{ insertId: number }>(
        "INSERT INTO SeasonPlayerRanks (steam_id, season_id, cs2_rank) VALUES (?, ?, ?)",
        [formData.players[4].steamId, seasonDetails.id, 10001]
      );

      await registrationServices.addPlayersForTeamInSeason(
        seasonDetails.id,
        seasonDetails.app_id,
        seasonDetails.platform,
        formData.teamId,
        formData.players.map((player) => ({
          steam_id: player.steamId,
          is_captain: Boolean(player.captain),
          is_co_captain: Boolean(player.coCaptain)
        }))
      );
      const [rankForSeason] = await runQuery<[SeasonPlayerRank]>(
        "SELECT * FROM SeasonPlayerRanks WHERE steam_id = ? AND season_id = ?",
        [formData.players[4].steamId, seasonDetails.id]
      );

      expect(rankForSeason.cs2_rank).toEqual(10001);
      expect(rankForSeason.cs_hours).toEqual(112);
      expect(rankForSeason.faceit_elo).toEqual(1301);
      expect(rankForSeason.faceit_kd).toEqual(1.35);
      expect(rankForSeason.faceit_level).toEqual(6);
      expect(rankForSeason.faceit_date).toBeDefined();
      // 4 times for app id rank, 5 times for external rank, except added player to db, 5 times for hours
      expect(redisClient.get as jest.Mock).toHaveBeenCalledTimes(14);

      await runQuery("DELETE FROM SeasonPlayerRanks WHERE id = ?", [
        idToRemove.insertId
      ]);
    });
    it("Should fallback to latest old seasons average rank if no current season rank can be determined", async () => {
      const formData = _.cloneDeep(validSignupData);
      formData.players.push({
        steamId: "11111111111111113",
        accountId: 9999113,
        nickname: "No Ranker"
      });

      const now = new Date();
      const threeMonthsAgo = new Date(
        now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000
      );
      const formattedDate = threeMonthsAgo.toISOString().split("T")[0];
      const twoMonthsAgo = new Date(
        now.getTime() - 2 * 30 * 24 * 60 * 60 * 1000
      );
      const formattedDate2 = twoMonthsAgo.toISOString().split("T")[0];
      await runQuery<{ insertId: number }>(
        "INSERT INTO SeasonPlayerRanks (steam_id, season_id, cs2_rank, rank_updated_at) VALUES (?, ?, ?, ?)",
        [formData.players[5].steamId, 14, 5000, formattedDate]
      );
      await runQuery<{ insertId: number }>(
        "INSERT INTO SeasonPlayerRanks (steam_id, season_id, cs2_rank, rank_updated_at) VALUES (?, ?, ?, ?)",
        [formData.players[5].steamId, 11, 10000, formattedDate2]
      );

      await registrationServices.addPlayersForTeamInSeason(
        seasonDetails.id,
        seasonDetails.app_id,
        seasonDetails.platform,
        formData.teamId,
        formData.players.map((player) => ({
          steam_id: player.steamId,
          is_captain: Boolean(player.captain),
          is_co_captain: Boolean(player.coCaptain)
        }))
      );
      const [rankForSeason] = await runQuery<[SeasonPlayerRank]>(
        "SELECT * FROM SeasonPlayerRanks WHERE steam_id = ? AND season_id = ?",
        [formData.players[5].steamId, seasonDetails.id]
      );

      // Should fetch season 14 rank even though season 11 is closer to now
      expect(rankForSeason.cs2_rank).toEqual(5000);
      expect(rankForSeason.cs_hours).toEqual(112);
      // 6 times for app id rank, 6 times for external rank, 6 times for hours, as there are 6 players
      expect(redisClient.get as jest.Mock).toHaveBeenCalledTimes(18);
    });
    it("Should fall back to csgo faceit rank if cs2 faceit rank not present, and apply decay on csgo faceit rank", async () => {
      const faceitReturnEloCsGo = 2700;
      const formData = _.cloneDeep(validSignupData);
      formData.players.push({
        steamId: "11111111111111114",
        accountId: 9999114,
        nickname: "CSGO Ranker"
      });

      await registrationServices.addPlayersForTeamInSeason(
        seasonDetails.id,
        seasonDetails.app_id,
        SeasonPlatform.FACEIT,
        formData.teamId,
        formData.players.map((player) => ({
          steam_id: player.steamId,
          is_captain: Boolean(player.captain),
          is_co_captain: Boolean(player.coCaptain)
        }))
      );
      const [getPlayerRank] = await runQuery<[SeasonPlayerRank]>(
        "SELECT * FROM SeasonPlayerRanks WHERE steam_id = ? AND season_id = ?",
        [formData.players[5].steamId, seasonDetails.id]
      );
      expect(getPlayerRank.cs2_rank).toEqual(23000);
      expect(getPlayerRank.csgo_rank).toEqual(null);
      expect(getPlayerRank.cs_hours).toEqual(112);

      // 10 % away as it's over 12 months
      expect(getPlayerRank.faceit_elo).toEqual(faceitReturnEloCsGo * 0.9);
      expect(getPlayerRank.faceit_level).toEqual(
        faceitEloToLevel(faceitReturnEloCsGo * 0.9)
      );
      expect(getPlayerRank.faceit_kd).toEqual(1.35);
      const date = new Date();
      const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      expect(getPlayerRank.rank_updated_at).toContain(formatted);
      expect(getPlayerRank.hours_updated_at).toContain(formatted);
      expect(getPlayerRank.faceit_date).toContain(formatted);
    });
  });
  // Captain permission tests removed - now handled by database triggers
  // Captain permission/role logic is now covered by dedicated integration tests (see captain-permission-constraints.test.ts)
  // The following tests and mocks for captain permission functions have been removed as they are obsolete.
  describe("handleSignupFormForSeasonUpdate", () => {
    beforeEach(async () => {
      await unsetSeasonTeamRegistration();
      await runQuery(
        "INSERT INTO SeasonTeamRegistrations (season_id, team_id, terms_and_conditions_approved) VALUES (?, ?, ?)",
        [seasonDetails.id, validSignupData.teamId, true]
      );
      await setSeasonTeamPlayers();
    });
    it("happy path, have called all functions with correct params", async () => {
      const formData = _.cloneDeep(validSignupData);
      formData.players[0].captain = false;
      formData.players[3].captain = true;
      const validatePlayersInDb = jest.spyOn(
        registrationServices,
        "validatePlayersFromDBForSignup"
      );
      const registrationUpdate = jest.spyOn(
        registrationModels,
        "updateSeasonTeamRegistration"
      );
      const updateAddPlayers = jest.spyOn(
        registrationModels,
        "updatePlayersForSeasonTeamRegistration"
      );
      // Removed describe block and all tests for updateCaptainPermissionsForSeasonTeam, including any spies or references to it.

      await registrationServices.handleSignupFormForSeasonUpdate(
        seasonDetails.id,
        2,
        formData
      );
      expect(validatePlayersInDb).toHaveBeenCalledWith(
        seasonDetails.id,
        formData.teamId,
        formData.organizationId,
        formData.players.map((player) => player.steamId)
      );
      expect(registrationUpdate).toHaveBeenCalledWith(
        seasonDetails.id,
        formData.teamId,
        {
          external_platform_id: formData.teamExternalId,
          terms_and_conditions_approved: true
        } satisfies UpdateSeasonTeamRegistration,
        undefined
      );
      expect(updateAddPlayers).toHaveBeenCalledWith(
        seasonDetails.id,
        2,
        formData.players.map((player) => ({
          steam_id: player.steamId,
          is_captain: Boolean(player.captain),
          is_co_captain: Boolean(player.coCaptain)
        })),
        undefined
      );
      // Removed describe block and all tests for updateCaptainPermissionsForSeasonTeam, including any spies or references to it.
    });
    it("should throw error when captain cannot be determined", async () => {
      const formData = _.cloneDeep(validSignupData);
      formData.players[0].captain = false;
      try {
        await registrationServices.handleSignupFormForSeasonUpdate(
          seasonDetails.id,
          2,
          formData
        );
      } catch (error) {
        const errAsBadReq = error as BadRequestError;
        expect(errAsBadReq.message).toEqual("Could not determine new captain.");
      }
    });
    it("should throw error when co-captain cannot be determined", async () => {
      const formData = _.cloneDeep(validSignupData);
      formData.players[1].coCaptain = false;
      try {
        await registrationServices.handleSignupFormForSeasonUpdate(
          seasonDetails.id,
          2,
          formData
        );
      } catch (error) {
        const errAsBadReq = error as BadRequestError;
        expect(errAsBadReq.message).toEqual(
          "Could not determine new co-captain."
        );
      }
    });
  });
  describe("updatePlayersForSeasonTeamRegistration", () => {
    beforeEach(async () => {
      await unsetSeasonTeamRegistration();
      await runQuery(
        "INSERT INTO SeasonTeamRegistrations (season_id, team_id, terms_and_conditions_approved) VALUES (?, ?, ?)",
        [seasonDetails.id, validSignupData.teamId, true]
      );
      await setSeasonTeamPlayers();
    });
    it("should return nothing when trying to insert same team", async () => {
      const nothingChanged =
        await registrationModels.updatePlayersForSeasonTeamRegistration(
          1,
          2,
          validSignupData.players.map((player) => ({
            steam_id: player.steamId,
            is_captain: Boolean(player.captain),
            is_co_captain: Boolean(player.coCaptain)
          }))
        );
      expect(nothingChanged.added.length).toEqual(0);
      expect(nothingChanged.removed.length).toEqual(0);
    });
    describe("with new account", () => {
      beforeEach(async () => {
        await insertOneTestUser(
          100000,
          "12345678912345601",
          "Nakki Kauppias",
          "nakki#123"
        );
      });
      afterEach(async () => {
        await runQuery("DELETE FROM SteamPlayers WHERE steam_id = ?", [
          "12345678912345601"
        ]);
        await runQuery("DELETE FROM Accounts WHERE id = ?", [100000]);
      });
      it("should add player to registration", async () => {
        const addedOne =
          await registrationModels.updatePlayersForSeasonTeamRegistration(
            1,
            2,
            [
              ...validSignupData.players.map((player) => ({
                steam_id: player.steamId,
                is_captain: Boolean(player.captain),
                is_co_captain: Boolean(player.coCaptain)
              })),

              {
                steam_id: "12345678912345601",
                is_captain: false,
                is_co_captain: false
              }
            ]
          );
        const [account] = await runQuery<Array<Account & SteamPlayer>>(
          "SELECT a.*, sp.* FROM Accounts a JOIN SteamPlayers sp ON sp.account_id = a.id WHERE a.id = ?",
          [100000]
        );
        expect(account.nickname).toEqual("Nakki Kauppias");
        expect(account.discord).toEqual("nakki#123");
        expect(addedOne.added.length).toEqual(1);
        expect(addedOne.added[0]).toEqual("12345678912345601");
        expect(addedOne.removed.length).toEqual(0);
      });
    });
    describe("with 6 players", () => {
      beforeEach(async () => {
        await insertOneTestUser(
          100000,
          "12345678912345601",
          "Nakki Kauppias",
          "nakki#123"
        );
        await setSeasonTeamPlayer(
          "12345678912345601",
          false,
          false,
          seasonDetails.id,
          validSignupData.teamId
        );
      });
      afterEach(async () => {
        await runQuery("DELETE FROM SteamPlayers WHERE steam_id = ?", [
          "12345678912345601"
        ]);
        await runQuery("DELETE FROM Accounts WHERE id = ?", [100000]);
      });
      it("should remove Nakki Kauppias from team registration", async () => {
        const addedOne =
          await registrationModels.updatePlayersForSeasonTeamRegistration(
            1,
            2,
            validSignupData.players.map((player) => ({
              steam_id: player.steamId,
              is_captain: Boolean(player.captain),
              is_co_captain: Boolean(player.coCaptain)
            }))
          );
        const [account] = await runQuery<Array<Account & SteamPlayer>>(
          "SELECT a.*, sp.* FROM Accounts a JOIN SteamPlayers sp ON sp.account_id = a.id WHERE a.id = ?",
          [100000]
        );
        expect(account.nickname).toEqual("Nakki Kauppias");
        expect(account.discord).toEqual("nakki#123");
        expect(addedOne.removed.length).toEqual(1);
        expect(addedOne.removed[0]).toEqual("12345678912345601");
        expect(addedOne.added.length).toEqual(0);
      });
    });
    describe("with two new accounts", () => {
      beforeEach(async () => {
        await insertOneTestUser(
          100000,
          "12345678912345601",
          "Nakki Kauppias",
          "nakki#123"
        );
        await insertOneTestUser(
          100001,
          "12345678912345603",
          "Saippua Kauppias",
          "soap#123"
        );
      });
      afterEach(async () => {
        await runQuery("DELETE FROM SteamPlayers WHERE steam_id = ?", [
          "12345678912345601"
        ]);
        await runQuery("DELETE FROM SteamPlayers WHERE steam_id = ?", [
          "12345678912345603"
        ]);
        await runQuery("DELETE FROM Accounts WHERE id = ?", [100000]);
        await runQuery("DELETE FROM Accounts WHERE id = ?", [100001]);
      });
      it("should add two player to registration and remove one existing", async () => {
        const addedOne =
          await registrationModels.updatePlayersForSeasonTeamRegistration(
            1,
            2,
            [
              {
                steam_id: validSignupData.players[0].steamId,
                is_captain: Boolean(validSignupData.players[0].captain),
                is_co_captain: Boolean(validSignupData.players[0].coCaptain)
              },
              {
                steam_id: validSignupData.players[1].steamId,
                is_captain: Boolean(validSignupData.players[1].captain),
                is_co_captain: Boolean(validSignupData.players[1].coCaptain)
              },
              {
                steam_id: validSignupData.players[3].steamId,
                is_captain: Boolean(validSignupData.players[3].captain),
                is_co_captain: Boolean(validSignupData.players[3].coCaptain)
              },
              {
                steam_id: validSignupData.players[4].steamId,
                is_captain: Boolean(validSignupData.players[4].captain),
                is_co_captain: Boolean(validSignupData.players[4].coCaptain)
              },
              {
                steam_id: "12345678912345601",
                is_captain: false,
                is_co_captain: false
              },
              {
                steam_id: "12345678912345603",
                is_captain: false,
                is_co_captain: false
              }
            ]
          );
        expect(addedOne.added.length).toEqual(2);
        expect(addedOne.added[0]).toEqual("12345678912345601");
        expect(addedOne.added[1]).toEqual("12345678912345603");
        expect(addedOne.removed.length).toEqual(1);
        expect(addedOne.removed[0]).toEqual(validSignupData.players[2].steamId);
      });
    });
  });
  // Captain permission/role logic is now covered by dedicated integration tests (see captain-permission-constraints.test.ts)
  // The following tests and mocks for captain permission functions have been removed as they are obsolete.

  describe("relational validation", () => {
    beforeEach(async () => {
      await unsetSeasonTeamRegistration();
      await clearSeasonPlayerRanks();
    });

    afterEach(async () => {
      await cleanupTestUsers();
      await insertTestUsersForSignup();
    });

    it("should validate team organization relationship", async () => {
      const formData = _.cloneDeep(validSignupData);
      // Use team that doesn't belong to the organization
      formData.teamId = 99999; // Non-existent team

      await expect(
        registrationServices.handleSignupFormForSeason(seasonDetails, formData)
      ).rejects.toThrow(/Team does not belong to the selected organization/);
    });
  });
});
