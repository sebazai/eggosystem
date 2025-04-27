/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type InsertSeason,
  type InsertSeasonTeamRegistration,
  type SeasonDetails,
  SeasonPlatform,
  type SignupNewOrganizationType,
  type SignupNewTeamType,
  type Team
} from "@eggosystem/types";
import {
  cleanupRolesAndPermissions,
  cleanupTestUsers,
  insertCaptainRoleAndPermission,
  insertTestSeason,
  insertTestUsersForSignup,
  removeTestOrg,
  removeTestSeason,
  removeTestTeam,
  setSeasonTeamPlayers
} from "../../__utils__/seed-database";
import * as registrationServices from "../../services/season-team-registration.services";
import * as organizationModels from "../../models/organization.models";
import * as registrationModels from "../../models/season-team-registration.models";
import * as teamModels from "../../models/team.models";
import _ from "lodash";
import { validSignupData } from "../../__utils__/fixtures/signupFormData";
import { type BadRequestError } from "../../utils/errors";
import { runQuery } from "../../db/mysqlRunQuery";
import {
  setupSmartFetchMockWithDynamicConfigs,
  updateFetchMock
} from "../../__utils__/fetchMock";
import {
  type IPlayerServiceResponse,
  type ISteamUserResponse
} from "../../services/steam.services";
import { type LeetifyResponse } from "../../services/leetify.services";

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
    platform: SeasonPlatform.Kanaliiga,
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

  // Mock fetches
  setupSmartFetchMockWithDynamicConfigs();

  beforeAll(async () => {
    await insertTestSeason(insertSeason);
    await insertTestUsersForSignup();
    await insertCaptainRoleAndPermission();
  });
  afterAll(async () => {
    await removeTestSeason(1);
    await cleanupTestUsers();
    await cleanupRolesAndPermissions();
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
  });
  describe("handleSeasonTeamRegistration", () => {
    it("happy path - have called all functions with valid data and does not return error", async () => {
      const formData = _.cloneDeep(validSignupData);
      const validatePlayersInDb = jest.spyOn(
        registrationServices,
        "validatePlayersFromDBForSignup"
      );
      const registrationInsert = jest.spyOn(
        registrationModels,
        "insertSeasonTeamRegistration"
      );
      const addPlayers = jest.spyOn(
        registrationServices,
        "addPlayersForTeamInSeason"
      );
      const captainPerm = jest.spyOn(
        registrationServices,
        "setCaptainPermissionsForSeason"
      );
      updateFetchMock([
        {
          urlContains: "GetPlayerSummaries",
          response: {
            response: {
              players: formData.players.map((player) => {
                return { steamid: player.steamId, communityvisibilitystate: 3 };
              })
            }
          } satisfies ISteamUserResponse
        },
        {
          urlContains: "https://api.cs-prod.leetify.com/api/profile/id",
          response: {
            games: [
              {
                isCs2: true,
                dataSource: "matchmaking",
                rankType: 11,
                skillLevel: 23430
              },
              {
                isCs2: true,
                dataSource: "faceit",
                elo: 2333,
                rankType: null,
                skillLevel: null
              }
            ]
          } satisfies LeetifyResponse
        },
        {
          urlContains: "GetOwnedGames",
          response: {
            response: {
              games: [
                {
                  appid: 730,
                  playtime_forever: 6747
                }
              ]
            }
          } satisfies IPlayerServiceResponse
        }
      ]);
      try {
        await registrationServices.handleSeasonTeamRegistration(
          seasonDetails.id,
          seasonDetails.platform,
          seasonDetails.app_id,
          formData.teamId,
          {
            captain_steam_id: formData.players[0].steamId,
            co_captain_steam_id: formData.players[1].steamId,
            external_platform_id: formData.teamExternalId
          } satisfies InsertSeasonTeamRegistration,
          formData.players
        );
        expect(validatePlayersInDb).toHaveBeenCalledWith(
          seasonDetails.id,
          formData.teamId,
          formData.players
        );
        expect(registrationInsert).toHaveBeenCalledWith(
          seasonDetails.id,
          formData.teamId,
          {
            captain_steam_id: formData.players[0].steamId,
            co_captain_steam_id: formData.players[1].steamId,
            external_platform_id: formData.teamExternalId
          },
          undefined
        );
        expect(addPlayers).toHaveBeenCalledWith(
          seasonDetails.id,
          seasonDetails.app_id,
          seasonDetails.platform,
          formData.teamId,
          formData.players,
          undefined
        );
        expect(captainPerm).toHaveBeenCalledWith(
          seasonDetails.id,
          formData.teamId,
          formData.players[0].steamId,
          formData.players[1].steamId,
          undefined
        );
      } finally {
        await runQuery(
          "DELETE FROM SeasonTeamRegistrations WHERE season_id = ? AND team_id = ?",
          [seasonDetails.id, formData.teamId]
        );
      }
    });
  });
  describe("validatePlayersFromDBForSignup", () => {
    beforeEach(() => {
      const formData = _.cloneDeep(validSignupData);
      updateFetchMock([
        {
          urlContains: "GetPlayerSummaries",
          response: {
            response: {
              players: formData.players.map((player) => {
                return { steamid: player.steamId, communityvisibilitystate: 3 };
              })
            }
          } satisfies ISteamUserResponse
        }
      ]);
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
          formData.players
        );
      } catch (error) {
        const badReqError = error as BadRequestError;
        expect(badReqError.message).toEqual(
          "Could not find players in database that is provided in the form"
        );
      } finally {
        await cleanupTestUsers();
        await insertTestUsersForSignup();
      }
    });
    it("Should fail if profiles are not public", async () => {
      const formData = _.cloneDeep(validSignupData);
      try {
        await registrationServices.validatePlayersFromDBForSignup(
          seasonDetails.id,
          formData.teamId,
          formData.players
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
          formData.players
        );
      } catch (error) {
        const asBadreq = error as BadRequestError;
        expect(asBadreq.message).toEqual(
          "Player 12345678901234571 has not accepted privacy policy."
        );
      } finally {
        await cleanupTestUsers();
        await insertTestUsersForSignup();
      }
    });
    it("Should fail if user has no work e-mail and has not been approved by organizer", async () => {
      const formData = _.cloneDeep(validSignupData);
      await runQuery("UPDATE Accounts SET work_email = ? WHERE id = ?", [
        null,
        formData.players[2].accountId
      ]);
      try {
        await registrationServices.validatePlayersFromDBForSignup(
          seasonDetails.id,
          formData.teamId,
          formData.players
        );
      } catch (error) {
        const asBadreq = error as BadRequestError;
        expect(asBadreq.message).toEqual(
          "Player 12345678901234569 does not have valid work e-mail and has not been approved by organizer. Contact the organizer in Discord."
        );
      } finally {
        await cleanupTestUsers();
        await insertTestUsersForSignup();
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
          formData.players
        );
      } catch (error) {
        const asBadreq = error as BadRequestError;
        expect(asBadreq.message).toEqual(
          "Player 12345678901234569 profile data missing."
        );
      } finally {
        await cleanupTestUsers();
        await insertTestUsersForSignup();
      }
    });
    it("Should pass if missing work e-mail in profile and manually approved by organizer", async () => {
      const formData = _.cloneDeep(validSignupData);
      await registrationModels.insertSeasonTeamRegistration(
        seasonDetails.id,
        formData.teamId,
        {
          captain_steam_id: formData.players[0].steamId,
          co_captain_steam_id: formData.players[1].steamId,
          external_platform_id: formData.teamExternalId
        }
      );
      await setSeasonTeamPlayers(seasonDetails.id);
      await runQuery("UPDATE Accounts SET work_email = ? WHERE id = ?", [
        null,
        formData.players[2].accountId
      ]);
      await runQuery(
        "UPDATE SeasonTeamPlayers SET employment_approved_by_organizer = ? WHERE steam_id = ?",
        [true, formData.players[2].steamId]
      );
      try {
        await registrationServices.validatePlayersFromDBForSignup(
          seasonDetails.id,
          formData.teamId,
          formData.players
        );
      } catch (_error) {
        // Should not come here.
        expect(true).toBe(false);
      } finally {
        await cleanupTestUsers();
        await insertTestUsersForSignup();
      }
    });
  });
  // describe("addPlayersForTeamInSeason", () => {
  //   it("should fail if a player is missing hours");
  //   it(
  //     "should fail if a player is missing either external rank or app id rank"
  //   );
  //   it("Should pass if app id rank is not present in redis, rank has been added manually by organizer into database");
  // });
  // describe("setCaptainPermissionsForSeason", () => {
  //   it(
  //     "should set only role captain with edit-registration permission for captain and co-captain for specific season and team"
  //   );
  //   it("should flush permissions from redis four times");
  // });
  // describe("removeCaptainPermissionForAccountId", () => {
  //   it(
  //     "should remove account permission scope for season and team when present"
  //   );
  //   it(
  //     "should remove role captain if no other captain specific scopes present for account"
  //   );
  //   it(
  //     "should not remove role captain if account has been captain for another season and team earlier"
  //   );
  // });
  // describe("updateCaptainPermissionsForSeasonTeam", () => {
  //   it("removes old captain ids and adds new captain ids");
  //   it("does not update if both id's are same");
  //   it("updates captain with different steam id but not co-captain");
  // });
});
