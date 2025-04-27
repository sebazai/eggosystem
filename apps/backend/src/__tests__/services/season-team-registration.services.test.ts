import { InsertSeason, SeasonDetails, SeasonPlatform } from "@eggosystem/types";
import {
  cleanupTestUsers,
  insertTestSeason,
  insertTestUsersForSignup,
  removeTestSeason
} from "../../__utils__/seed-database";
import * as registrationServices from "../../services/season-team-registration.services";
import _ from "lodash";
import { validSignupData } from "../../__utils__/fixtures/signupFormData";
import { BadRequestError } from "../../utils/errors";

describe("Season team registration services", () => {
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
        expect(asBadReq.message).toEqual(
          "Could not determine captain and co-captain."
        );
        expect(asBadReq.status).toEqual(400);
      }
    });
    //   it("Should throw error if co-captain not in form data");
    //   it("Should ");
    //   describe("new org and new team", () => {
    //     it(
    //       "Should throw error if trying to create a new organization for existing team"
    //     );
    //     it("Should add new organization");
    //     it("Should add new team");
    //   });
    //   describe("existing org and new team", () => {
    //     it("Should not add new org");
    //     it("Should add new team as org approved false");
    //   });
    //   describe("existing org and existing team", () => {
    //     it("Should throw error if team not part of organization");
    //   });
    // });
    // describe("handleSeasonTeamRegistration", () => {
    //   it("have called all functions with valid data");
    // });
    // describe("validatePlayersFromDBForSignup", () => {
    //   it("should fail if a player steam id in form is not present in database");
    //   it("Should fail if profile not public");
    //   it("Should fail if not accepted privacy policy");
    //   it("Should fail if user has no work e-mail");
    //   it(
    //     "Should fail if user has no work e-mail and has not been approved by organizer"
    //   );
    //   it("Should fail if no full_name in profile");
    //   it(
    //     "Should pass if missing work e-mail in profile and manually approved by organizer"
    //   );
    //   it(
    //     "Should pass if app id rank is not present in redis, rank has been added manually by organizer into database"
    //   );
    // });
    // describe("addPlayersForTeamInSeason", () => {
    //   it("should fail if a player is missing hours");
    //   it(
    //     "should fail if a player is missing either external rank or app id rank"
    //   );
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
  });
});
