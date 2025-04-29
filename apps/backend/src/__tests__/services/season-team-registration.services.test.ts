/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type Account,
  type AccountPermissionScopes,
  type AccountRole,
  type InsertSeason,
  type InsertSeasonTeamRegistration,
  type Permission,
  type SeasonDetails,
  SeasonPlatform,
  type SeasonPlayerRank,
  type SignupNewOrganizationType,
  type SignupNewTeamType,
  type SteamPlayer,
  type Team
} from "@eggosystem/types";
import {
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
  setCaptainEditRegistrationForAccountId,
  setSeasonTeamPlayer,
  setSeasonTeamPlayers,
  setSeasonTeamRegistration,
  unsetSeasonTeamRegistration
} from "../../__utils__/seed-database";
import * as registrationServices from "../../services/season-team-registration.services";
import * as authServices from "../../services/auth.services";
import * as organizationModels from "../../models/organization.models";
import * as accountRolesModels from "../../models/account-roles.models";
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
import { redisClient } from "../../utils/redisClient";

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
          "Player 12345678901234570 has not accepted privacy policy."
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
          "Player 12345678901234568 does not have valid work e-mail and has not been approved by organizer. Contact the organizer in Discord."
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
          "Player 12345678901234568 profile data missing."
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
  describe("addPlayersForTeamInSeason", () => {
    beforeEach(async () => {
      await unsetSeasonTeamRegistration();
      await setSeasonTeamRegistration();
      await clearSeasonPlayerRanks();
    });
    it("should fail if a player is missing hours for app_id", async () => {
      updateFetchMock([
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
                  appid: 731,
                  playtime_forever: 6747
                }
              ]
            }
          } satisfies IPlayerServiceResponse
        }
      ]);

      const formData = _.cloneDeep(validSignupData);
      try {
        await registrationServices.addPlayersForTeamInSeason(
          seasonDetails.id,
          seasonDetails.app_id,
          seasonDetails.platform,
          formData.teamId,
          formData.players
        );
      } catch (error) {
        const asBadreq = error as BadRequestError;
        expect(asBadreq.message).toEqual(
          "Player 12345678901234566 hours not found."
        );
      }
    });
    it("should fail if a player is missing either external rank or app id rank", async () => {
      updateFetchMock([
        {
          urlContains: "https://api.cs-prod.leetify.com/api/profile/id",
          response: {
            games: []
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
      const formData = _.cloneDeep(validSignupData);
      try {
        await registrationServices.addPlayersForTeamInSeason(
          seasonDetails.id,
          seasonDetails.app_id,
          seasonDetails.platform,
          formData.teamId,
          formData.players
        );
      } catch (error) {
        const asBadreq = error as BadRequestError;
        expect(asBadreq.message).toEqual(
          "Player 12345678901234566 rank not found for app 730."
        );
      }
    });
    it("Should pass if app id rank is present but external platform rank not", async () => {
      updateFetchMock([
        {
          urlContains: "https://api.cs-prod.leetify.com/api/profile/id",
          response: {
            games: [
              {
                isCs2: true,
                dataSource: "matchmaking",
                rankType: 11,
                skillLevel: 23430
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
      const formData = _.cloneDeep(validSignupData);

      try {
        await registrationServices.addPlayersForTeamInSeason(
          seasonDetails.id,
          seasonDetails.app_id,
          SeasonPlatform.FACEIT,
          formData.teamId,
          formData.players
        );
        const [rankForSeason] = await runQuery<[SeasonPlayerRank]>(
          "SELECT * FROM SeasonPlayerRanks WHERE steam_id = ? AND season_id = ?",
          [formData.players[4].steamId, seasonDetails.id]
        );
        expect(rankForSeason.cs2_rank).toEqual(23430);
        expect(rankForSeason.cs_hours).toEqual(112);
        expect(rankForSeason.faceit_elo).toEqual(-1);
        expect(rankForSeason.faceit_level).toEqual(-1);
        expect(rankForSeason.faceit_kd).toEqual(-1);
        // 5 times for app id rank, 5 times for hours, 5 times for external rank
        expect(redisClient.get as jest.Mock).toHaveBeenCalledTimes(15);
      } catch (_error) {
        // Should not error
        expect(true).toBe(false);
      }
    });
    it("Should throw error if no rank and no external rank", async () => {
      updateFetchMock([
        {
          urlContains:
            "https://api.cs-prod.leetify.com/api/profile/id/1234567890123456",
          response: {
            games: [
              {
                isCs2: true,
                dataSource: "matchmaking",
                rankType: 11,
                skillLevel: 23430
              }
            ]
          } satisfies LeetifyResponse
        },
        {
          urlContains:
            "https://api.cs-prod.leetify.com/api/profile/id/12345678901234570",
          response: {
            games: []
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
      const formData = _.cloneDeep(validSignupData);

      try {
        await registrationServices.addPlayersForTeamInSeason(
          seasonDetails.id,
          seasonDetails.app_id,
          SeasonPlatform.FACEIT,
          formData.teamId,
          formData.players
        );
      } catch (error) {
        const errorAsBadReq = error as BadRequestError;
        expect(errorAsBadReq.message).toEqual(
          "Player 12345678901234570 has no app id rank or faceit rank."
        );
      }
    });
    it("Should pass if external platform rank is present but app rank not", async () => {
      updateFetchMock([
        {
          urlContains:
            "https://api.cs-prod.leetify.com/api/profile/id/1234567890123456",
          response: {
            games: [
              {
                isCs2: true,
                dataSource: "matchmaking",
                rankType: 11,
                skillLevel: 23430
              }
            ]
          } satisfies LeetifyResponse
        },
        {
          urlContains:
            "https://api.cs-prod.leetify.com/api/profile/id/12345678901234570",
          response: {
            games: []
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
        },
        {
          urlContains: "https://open.faceit.com/data/v4/players?game",
          response: {
            player_id: "123",
            games: {
              cs2: {
                faceit_elo: "1301",
                skill_level: "6"
              }
            }
          }
        },
        {
          urlContains: "/stats/cs2",
          response: {
            lifetime: {
              "Average K/D Ratio": "1.35",
              Matches: 453
            }
          }
        },
        {
          urlContains: "/games/cs2/stats",
          response: {
            items: [
              {
                stats: {
                  "Created At": 1745078400000
                }
              }
            ]
          }
        }
      ]);
      const formData = _.cloneDeep(validSignupData);

      try {
        await registrationServices.addPlayersForTeamInSeason(
          seasonDetails.id,
          seasonDetails.app_id,
          SeasonPlatform.FACEIT,
          formData.teamId,
          formData.players
        );
        const [getPlayerRank] = await runQuery<[SeasonPlayerRank]>(
          "SELECT * FROM SeasonPlayerRanks WHERE steam_id = ? AND season_id = ?",
          [formData.players[4].steamId, seasonDetails.id]
        );
        expect(getPlayerRank.cs2_rank).toEqual(-1);
        expect(getPlayerRank.csgo_rank).toEqual(-1);
        expect(getPlayerRank.cs_hours).toEqual(112);
        expect(getPlayerRank.faceit_level).toEqual(6);
        expect(getPlayerRank.faceit_elo).toEqual(1301);
        expect(getPlayerRank.faceit_kd).toEqual(1.35);
        const date = new Date();
        const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        expect(getPlayerRank.rank_updated_at).toContain(formatted);
        expect(getPlayerRank.hours_updated_at).toContain(formatted);
        expect(getPlayerRank.faceit_date).toContain(formatted);
      } catch (_error) {
        expect(true).toBe(false);
      }
    });
    it("Should pass if app id rank is not present in redis, or leetify, rank has been added manually by organizer into database", async () => {
      updateFetchMock([
        {
          urlContains:
            "https://api.cs-prod.leetify.com/api/profile/id/1234567890123456",
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
          urlContains:
            "https://api.cs-prod.leetify.com/api/profile/id/12345678901234570",
          response: {
            games: []
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
      const formData = _.cloneDeep(validSignupData);
      const idToRemove = await runQuery<{ insertId: number }>(
        "INSERT INTO SeasonPlayerRanks (steam_id, season_id, cs2_rank) VALUES (?, ?, ?)",
        [formData.players[4].steamId, seasonDetails.id, 10001]
      );

      try {
        await registrationServices.addPlayersForTeamInSeason(
          seasonDetails.id,
          seasonDetails.app_id,
          seasonDetails.platform,
          formData.teamId,
          formData.players
        );
        const [rankForSeason] = await runQuery<[SeasonPlayerRank]>(
          "SELECT * FROM SeasonPlayerRanks WHERE steam_id = ? AND season_id = ?",
          [formData.players[4].steamId, seasonDetails.id]
        );
        expect(rankForSeason.cs2_rank).toEqual(10001);
        expect(rankForSeason.cs_hours).toEqual(112);
        expect(rankForSeason.faceit_elo).toEqual(null);
        expect(rankForSeason.faceit_kd).toEqual(null);
        expect(rankForSeason.faceit_level).toEqual(null);
        expect(rankForSeason.faceit_date).toEqual("1970-01-01 10:00:00");
        // 5 times for app id rank, 5 times for hours
        expect(redisClient.get as jest.Mock).toHaveBeenCalledTimes(10);
      } catch (_error) {
        // Should not error
        expect(true).toBe(false);
      } finally {
        await runQuery("DELETE FROM SeasonPlayerRanks WHERE id = ?", [
          idToRemove.insertId
        ]);
      }
    });
    it("Should fallback to latest old season rank if no current season rank can be determined", async () => {
      updateFetchMock([
        {
          urlContains:
            "https://api.cs-prod.leetify.com/api/profile/id/1234567890123456",
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
          urlContains:
            "https://api.cs-prod.leetify.com/api/profile/id/12345678901234570",
          response: {
            games: []
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
      const formData = _.cloneDeep(validSignupData);
      const idToRemove2 = await runQuery<{ insertId: number }>(
        "INSERT INTO SeasonPlayerRanks (steam_id, season_id, cs2_rank) VALUES (?, ?, ?)",
        [formData.players[4].steamId, 14, 9998]
      );
      const idToRemove = await runQuery<{ insertId: number }>(
        "INSERT INTO SeasonPlayerRanks (steam_id, season_id, cs2_rank) VALUES (?, ?, ?)",
        [formData.players[4].steamId, 11, 9999]
      );

      try {
        await registrationServices.addPlayersForTeamInSeason(
          seasonDetails.id,
          seasonDetails.app_id,
          seasonDetails.platform,
          formData.teamId,
          formData.players
        );
        const [rankForSeason] = await runQuery<[SeasonPlayerRank]>(
          "SELECT * FROM SeasonPlayerRanks WHERE steam_id = ? AND season_id = ?",
          [formData.players[4].steamId, seasonDetails.id]
        );
        expect(rankForSeason.cs2_rank).toEqual(9998);
        expect(rankForSeason.cs_hours).toEqual(112);
        // 5 times for app id rank, 5 times for hours
        expect(redisClient.get as jest.Mock).toHaveBeenCalledTimes(10);
      } catch (_error) {
        // Should not error
        expect(true).toBe(false);
      } finally {
        await runQuery("DELETE FROM SeasonPlayerRanks WHERE id = ?", [
          idToRemove.insertId
        ]);
        await runQuery("DELETE FROM SeasonPlayerRanks WHERE id = ?", [
          idToRemove2.insertId
        ]);
      }
    });
    it("Should fall back to csgo rank if cs2 not present, and apply decay on csgo rank", async () => {
      const faceitReturnEloCsGo = 2700;
      const faceitReturnLevelCsGo = 9;
      updateFetchMock([
        {
          urlContains:
            "https://api.cs-prod.leetify.com/api/profile/id/1234567890123456",
          response: {
            games: [
              {
                isCs2: true,
                dataSource: "matchmaking",
                rankType: 11,
                skillLevel: 23430
              }
            ]
          } satisfies LeetifyResponse
        },
        {
          urlContains:
            "https://api.cs-prod.leetify.com/api/profile/id/12345678901234570",
          response: {
            games: []
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
        },
        {
          urlContains: "https://open.faceit.com/data/v4/players?game",
          response: {
            player_id: "123",
            games: {
              csgo: {
                faceit_elo: faceitReturnEloCsGo,
                skill_level: faceitReturnLevelCsGo
              }
            }
          }
        },
        {
          urlContains: "/stats/cs2",
          response: {
            lifetime: {
              "Average K/D Ratio": "1.35",
              Matches: 453
            }
          }
        },
        {
          urlContains: "/games/cs2/stats",
          response: {
            items: [
              {
                stats: {
                  "Created At": 1713542400000
                }
              }
            ]
          }
        }
      ]);
      const formData = _.cloneDeep(validSignupData);

      try {
        await registrationServices.addPlayersForTeamInSeason(
          seasonDetails.id,
          seasonDetails.app_id,
          SeasonPlatform.FACEIT,
          formData.teamId,
          formData.players
        );
        const [getPlayerRank] = await runQuery<[SeasonPlayerRank]>(
          "SELECT * FROM SeasonPlayerRanks WHERE steam_id = ? AND season_id = ?",
          [formData.players[4].steamId, seasonDetails.id]
        );
        expect(getPlayerRank.cs2_rank).toEqual(-1);
        expect(getPlayerRank.csgo_rank).toEqual(-1);
        expect(getPlayerRank.cs_hours).toEqual(112);
        // -3 as it's over 12 months
        expect(getPlayerRank.faceit_level).toEqual(faceitReturnLevelCsGo - 3);
        // 15 % away as it's over 12 months
        expect(getPlayerRank.faceit_elo).toEqual(faceitReturnEloCsGo * 0.85);
        expect(getPlayerRank.faceit_kd).toEqual(1.35);
        const date = new Date();
        const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        expect(getPlayerRank.rank_updated_at).toContain(formatted);
        expect(getPlayerRank.hours_updated_at).toContain(formatted);
        expect(getPlayerRank.faceit_date).toContain(formatted);
      } catch (_error) {
        expect(true).toBe(false);
      }
    });
  });
  describe("setCaptainPermissionsForSeason", () => {
    beforeEach(async () => {
      await runQuery("DELETE FROM AccountPermissionScopes");
    });
    it("should set only role captain with edit-registration permission for captain and co-captain for specific season and team", async () => {
      const formData = _.cloneDeep(validSignupData);
      const setRoleSpy = jest.spyOn(accountRolesModels, "setRoleForAccount");
      const setScopedSpy = jest.spyOn(
        accountRolesModels,
        "setScopedPermissionForAccount"
      );

      await registrationServices.setCaptainPermissionsForSeason(
        1,
        formData.teamId,
        formData.players[0].steamId,
        formData.players[1].steamId
      );
      const data = await runQuery<Array<AccountPermissionScopes>>(
        "SELECT aps.*, p.permission_name FROM AccountPermissionScopes aps JOIN Permissions p ON p.id = aps.permission_id"
      );
      expect(setRoleSpy).toHaveBeenCalledTimes(2);
      expect(setRoleSpy).toHaveBeenCalledWith("captain", 99999, undefined);
      expect(setRoleSpy).toHaveBeenCalledWith("captain", 99998, undefined);
      expect(setScopedSpy).toHaveBeenCalledTimes(2);
      expect(setScopedSpy).toHaveBeenCalledWith(
        "edit-registration",
        99999,
        1,
        2,
        undefined
      );
      expect(setScopedSpy).toHaveBeenCalledWith(
        "edit-registration",
        99998,
        1,
        2,
        undefined
      );
      expect(data.length).toEqual(2);
      expect(data[0]).toEqual(
        expect.objectContaining({
          account_id: 99999,
          permission_name: "edit-registration",
          season_id: 1,
          team_id: 2
        })
      );
      expect(data[1]).toEqual(
        expect.objectContaining({
          account_id: 99998,
          permission_name: "edit-registration",
          season_id: 1,
          team_id: 2
        })
      );
    });
    it("should flush permissions from redis four times", async () => {
      const authSpy = jest.spyOn(authServices, "flushPermissionsForAccountId");
      const formData = _.cloneDeep(validSignupData);
      await registrationServices.setCaptainPermissionsForSeason(
        1,
        formData.teamId,
        formData.players[0].steamId,
        formData.players[1].steamId
      );
      expect(authSpy).toHaveBeenCalledTimes(4);
      expect(redisClient.set as jest.Mock).toHaveBeenCalledTimes(0);
      expect(redisClient.get as jest.Mock).toHaveBeenCalledTimes(0);
    });
    it("should call only for captain", async () => {
      const formData = _.cloneDeep(validSignupData);
      const setRoleSpy = jest.spyOn(accountRolesModels, "setRoleForAccount");
      const setScopedSpy = jest.spyOn(
        accountRolesModels,
        "setScopedPermissionForAccount"
      );

      await registrationServices.setCaptainPermissionsForSeason(
        1,
        formData.teamId,
        formData.players[0].steamId
      );
      const data = await runQuery<Array<AccountPermissionScopes>>(
        "SELECT aps.*, p.permission_name FROM AccountPermissionScopes aps JOIN Permissions p ON p.id = aps.permission_id"
      );
      expect(setRoleSpy).toHaveBeenCalledTimes(1);
      expect(setRoleSpy).toHaveBeenCalledWith("captain", 99999, undefined);

      expect(setScopedSpy).toHaveBeenCalledTimes(1);
      expect(setScopedSpy).toHaveBeenCalledWith(
        "edit-registration",
        99999,
        1,
        2,
        undefined
      );
      expect(data.length).toEqual(1);
      expect(data[0]).toEqual(
        expect.objectContaining({
          account_id: 99999,
          permission_name: "edit-registration",
          season_id: 1,
          team_id: 2
        })
      );
    });
  });
  describe("removeCaptainPermissionForAccountId", () => {
    beforeEach(async () => {
      await runQuery("DELETE FROM AccountPermissionScopes");
      await runQuery("DELETE FROM AccountRoles");
      await setCaptainEditRegistrationForAccountId(
        validSignupData.players[0].accountId
      );
    });
    it("should remove account permission scope for season and team when present", async () => {
      const dataBefore = await runQuery<Array<AccountPermissionScopes>>(
        "SELECT * FROM AccountPermissionScopes"
      );
      expect(dataBefore.length).toEqual(1);
      await registrationServices.removeCaptainPermissionForAccountId(
        validSignupData.players[0].accountId,
        seasonDetails.id,
        validSignupData.teamId
      );
      const data = await runQuery<Array<AccountPermissionScopes>>(
        "SELECT * FROM AccountPermissionScopes"
      );
      expect(data.length).toEqual(0);
    });
    it("should remove role captain if no other captain specific scopes present for account", async () => {
      const dataBefore = await runQuery<Array<AccountPermissionScopes>>(
        "SELECT * FROM AccountPermissionScopes"
      );
      const roleDataBefore = await runQuery<Array<AccountRole>>(
        "SELECT * FROM AccountRoles"
      );
      expect(dataBefore.length).toEqual(1);
      expect(roleDataBefore.length).toEqual(1);
      await registrationServices.removeCaptainPermissionForAccountId(
        validSignupData.players[0].accountId,
        seasonDetails.id,
        validSignupData.teamId
      );
      const data = await runQuery<Array<AccountPermissionScopes>>(
        "SELECT * FROM AccountPermissionScopes"
      );
      const accountRole = await runQuery<Array<AccountRole>>(
        "SELECT * FROM AccountRoles"
      );
      expect(data.length).toEqual(0);
      expect(accountRole.length).toEqual(0);
    });
    describe("with multiple captain roles", () => {
      beforeEach(async () => {
        const [permission] = await runQuery<[{ id: number }]>(
          "SELECT id FROM Permissions WHERE permission_name = ?",
          ["edit-registration"]
        );
        await runQuery(
          "INSERT INTO AccountPermissionScopes (season_id, team_id, account_id, permission_id) VALUES (?, ?, ?, ?)",
          [
            11,
            validSignupData.teamId,
            validSignupData.players[0].accountId,
            permission.id
          ]
        );
      });
      it("should not remove role captain if account has been captain for another season and team earlier", async () => {
        const dataBefore = await runQuery<Array<AccountPermissionScopes>>(
          "SELECT * FROM AccountPermissionScopes"
        );
        const roleDataBefore = await runQuery<Array<AccountRole>>(
          "SELECT * FROM AccountRoles"
        );
        expect(dataBefore.length).toEqual(2);
        expect(roleDataBefore.length).toEqual(1);
        await registrationServices.removeCaptainPermissionForAccountId(
          validSignupData.players[0].accountId,
          seasonDetails.id,
          validSignupData.teamId
        );
        const data = await runQuery<Array<AccountPermissionScopes>>(
          "SELECT * FROM AccountPermissionScopes"
        );
        const accountRole = await runQuery<Array<AccountRole>>(
          "SELECT * FROM AccountPermissionScopes"
        );
        expect(data.length).toEqual(1);
        expect(data[0]).toEqual(
          expect.objectContaining({
            season_id: 11,
            team_id: 2,
            account_id: 99999
          })
        );
        expect(accountRole.length).toEqual(1);
      });
    });
  });
  describe("handleSignupFormForSeasonUpdate", () => {
    beforeEach(async () => {
      await unsetSeasonTeamRegistration();
      await runQuery(
        "INSERT INTO SeasonTeamRegistrations (season_id, team_id, captain_steam_id, co_captain_steam_id) VALUES (?, ?, ?, ?)",
        [
          seasonDetails.id,
          validSignupData.teamId,
          validSignupData.players[0].steamId,
          validSignupData.players[1].steamId
        ]
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
      const captainPerm = jest.spyOn(
        registrationServices,
        "updateCaptainPermissionsForSeasonTeam"
      );
      updateFetchMock([
        {
          urlContains: "GetPlayerSummaries",
          response: {
            response: {
              players: formData.players.map((player) => {
                return {
                  steamid: player.steamId,
                  communityvisibilitystate: 3
                };
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

      await registrationServices.handleSignupFormForSeasonUpdate(
        seasonDetails.id,
        2,
        formData
      );
      expect(validatePlayersInDb).toHaveBeenCalledWith(
        seasonDetails.id,
        formData.teamId,
        formData.players
      );
      expect(registrationUpdate).toHaveBeenCalledWith(
        seasonDetails.id,
        formData.teamId,
        {
          captain_steam_id: formData.players[3].steamId,
          co_captain_steam_id: formData.players[1].steamId,
          external_platform_id: formData.teamExternalId
        },
        undefined
      );
      expect(updateAddPlayers).toHaveBeenCalledWith(
        seasonDetails.id,
        2,
        formData.players,
        undefined
      );
      expect(captainPerm).toHaveBeenCalledWith(
        seasonDetails.id,
        formData.teamId,
        formData.players[3].steamId,
        // For some reason mysql2 returns as Number
        Number(formData.players[0].steamId),
        formData.players[1].steamId,
        formData.players[1].steamId,
        undefined
      );
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
        "INSERT INTO SeasonTeamRegistrations (season_id, team_id, captain_steam_id, co_captain_steam_id) VALUES (?, ?, ?, ?)",
        [
          seasonDetails.id,
          validSignupData.teamId,
          validSignupData.players[0].steamId,
          validSignupData.players[1].steamId
        ]
      );
      await setSeasonTeamPlayers();
    });
    it("should return nothing when trying to insert same team", async () => {
      const nothingChanged =
        await registrationModels.updatePlayersForSeasonTeamRegistration(
          1,
          2,
          validSignupData.players
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
        await runQuery("DELETE FROM Accounts WHERE id = ?", [100000]);
      });
      it("should add player to registration", async () => {
        const addedOne =
          await registrationModels.updatePlayersForSeasonTeamRegistration(
            1,
            2,
            [
              ...validSignupData.players,
              {
                nickname: "Nakki",
                accountId: 100000,
                steamId: "12345678912345601",
                discord: "NotChanged"
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
        await setSeasonTeamPlayer("12345678912345601");
      });
      afterEach(async () => {
        await runQuery("DELETE FROM Accounts WHERE id = ?", [100000]);
      });
      it("should remove Nakki Kauppias from team registration", async () => {
        const addedOne =
          await registrationModels.updatePlayersForSeasonTeamRegistration(
            1,
            2,
            validSignupData.players
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
        await runQuery("DELETE FROM Accounts WHERE id = ?", [100000]);
        await runQuery("DELETE FROM Accounts WHERE id = ?", [100001]);
      });
      it("should add two player to registration and remove one existing", async () => {
        const addedOne =
          await registrationModels.updatePlayersForSeasonTeamRegistration(
            1,
            2,
            [
              validSignupData.players[0],
              validSignupData.players[1],
              validSignupData.players[3],
              validSignupData.players[4],
              {
                nickname: "Nakki",
                accountId: 100000,
                steamId: "12345678912345601",
                discord: "NotChanged"
              },
              {
                nickname: "saippua",
                accountId: 100001,
                steamId: "12345678912345603"
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
  describe("updateCaptainPermissionsForSeasonTeam", () => {
    beforeEach(async () => {
      await unsetSeasonTeamRegistration();
      await runQuery("DELETE FROM AccountPermissionScopes");
      await runQuery("DELETE FROM AccountRoles");
      await setSeasonTeamRegistration();
      await setCaptainEditRegistrationForAccountId(
        validSignupData.players[0].accountId
      );
      await setCaptainEditRegistrationForAccountId(
        validSignupData.players[1].accountId
      );
    });

    it("removes old captain id and adds new captain id, does not change co-captain", async () => {
      const formData = _.cloneDeep(validSignupData);
      const beforeReg = await runQuery<Array<AccountPermissionScopes>>(
        "SELECT * FROM AccountPermissionScopes"
      );
      expect(beforeReg.length).toEqual(2);
      expect(beforeReg[0]).toEqual(
        expect.objectContaining({ account_id: 99999, season_id: 1, team_id: 2 })
      );
      expect(beforeReg[1]).toEqual(
        expect.objectContaining({ account_id: 99998, season_id: 1, team_id: 2 })
      );
      const spyOnSetPerm = jest.spyOn(
        registrationServices,
        "setCaptainPermissionsForSeason"
      );
      const spyOnRemove = jest.spyOn(
        registrationServices,
        "removeCaptainPermissionForAccountId"
      );
      await registrationServices.updateCaptainPermissionsForSeasonTeam(
        seasonDetails.id,
        formData.teamId,
        formData.players[3].steamId,
        formData.players[0].steamId,
        formData.players[1].steamId,
        formData.players[1].steamId
      );
      const editedReg = await runQuery<Array<AccountPermissionScopes>>(
        "SELECT * FROM AccountPermissionScopes"
      );
      expect(editedReg.length).toEqual(2);
      expect(editedReg[0]).toEqual(
        expect.objectContaining({ account_id: 99998, season_id: 1, team_id: 2 })
      );
      expect(editedReg[1]).toEqual(
        expect.objectContaining({ account_id: 99996, season_id: 1, team_id: 2 })
      );
      expect(spyOnSetPerm).toHaveBeenCalledTimes(1);
      expect(spyOnRemove).toHaveBeenCalledTimes(1);
      expect(spyOnSetPerm).toHaveBeenCalledWith(
        1,
        2,
        "12345678901234569",
        undefined,
        undefined
      );
      expect(spyOnRemove).toHaveBeenCalledWith(99999, 1, 2, undefined);
    });
    it("does not update if both id's are same", async () => {
      const formData = _.cloneDeep(validSignupData);
      const beforeReg = await runQuery<Array<AccountPermissionScopes>>(
        "SELECT * FROM AccountPermissionScopes"
      );
      expect(beforeReg.length).toEqual(2);
      expect(beforeReg[0]).toEqual(
        expect.objectContaining({ account_id: 99999, season_id: 1, team_id: 2 })
      );
      expect(beforeReg[1]).toEqual(
        expect.objectContaining({ account_id: 99998, season_id: 1, team_id: 2 })
      );
      const spyOnSetPerm = jest.spyOn(
        registrationServices,
        "setCaptainPermissionsForSeason"
      );
      const spyOnRemove = jest.spyOn(
        registrationServices,
        "removeCaptainPermissionForAccountId"
      );
      await registrationServices.updateCaptainPermissionsForSeasonTeam(
        seasonDetails.id,
        formData.teamId,
        formData.players[0].steamId,
        formData.players[0].steamId,
        formData.players[1].steamId,
        formData.players[1].steamId
      );
      const editedReg = await runQuery<Array<AccountPermissionScopes>>(
        "SELECT * FROM AccountPermissionScopes"
      );
      expect(editedReg.length).toEqual(2);
      expect(beforeReg[0]).toEqual(
        expect.objectContaining({ account_id: 99999, season_id: 1, team_id: 2 })
      );
      expect(beforeReg[1]).toEqual(
        expect.objectContaining({ account_id: 99998, season_id: 1, team_id: 2 })
      );
      expect(spyOnSetPerm).toHaveBeenCalledTimes(0);
      expect(spyOnRemove).toHaveBeenCalledTimes(0);
    });
    describe("with double scoped permission", () => {
      beforeEach(async () => {
        await setCaptainEditRegistrationForAccountId(
          validSignupData.players[0].accountId,
          11
        );
      });
      it("does update but does not remove role and scoped permission if player has another scoped permission", async () => {
        const formData = _.cloneDeep(validSignupData);
        const beforeReg = await runQuery<Array<AccountPermissionScopes>>(
          "SELECT * FROM AccountPermissionScopes"
        );
        expect(beforeReg.length).toEqual(3);
        expect(beforeReg[0]).toEqual(
          expect.objectContaining({
            account_id: 99999,
            season_id: 1,
            team_id: 2
          })
        );
        expect(beforeReg[1]).toEqual(
          expect.objectContaining({
            account_id: 99998,
            season_id: 1,
            team_id: 2
          })
        );
        expect(beforeReg[2]).toEqual(
          expect.objectContaining({
            account_id: 99999,
            season_id: 11,
            team_id: 2
          })
        );
        const spyOnSetPerm = jest.spyOn(
          registrationServices,
          "setCaptainPermissionsForSeason"
        );
        const spyOnRemove = jest.spyOn(
          registrationServices,
          "removeCaptainPermissionForAccountId"
        );
        await registrationServices.updateCaptainPermissionsForSeasonTeam(
          seasonDetails.id,
          formData.teamId,
          formData.players[3].steamId,
          formData.players[0].steamId,
          formData.players[2].steamId,
          formData.players[1].steamId
        );
        const editedReg = await runQuery<
          Array<AccountPermissionScopes & Permission>
        >(
          "SELECT aps.*, p.permission_name FROM AccountPermissionScopes aps JOIN Permissions p ON p.id = aps.permission_id ORDER BY aps.id"
        );

        expect(editedReg.length).toEqual(3);
        expect(editedReg[0]).toEqual(
          expect.objectContaining({
            account_id: 99999,
            permission_name: "edit-registration",
            season_id: 11,
            team_id: 2
          })
        );
        expect(editedReg[1]).toEqual(
          expect.objectContaining({
            account_id: 99996,
            permission_name: "edit-registration",
            season_id: 1,
            team_id: 2
          })
        );
        expect(editedReg[2]).toEqual(
          expect.objectContaining({
            account_id: 99997,
            permission_name: "edit-registration",
            season_id: 1,
            team_id: 2
          })
        );
        expect(spyOnSetPerm).toHaveBeenCalledTimes(1);
        expect(spyOnRemove).toHaveBeenCalledTimes(2);
      });
    });
  });
});
