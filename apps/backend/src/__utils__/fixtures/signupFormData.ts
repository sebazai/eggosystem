import { type SignupFormValues } from "@eggosystem/types";

export const validSignupData: SignupFormValues = {
  organizationId: 102,
  teamId: 2,
  teamExternalId: "team-123",
  players: [
    {
      accountId: 99999,
      steamId: "12345678901234567",
      nickname: "Player One",
      discord: "playerOne#1234",
      captain: true
    },
    {
      accountId: 99998,
      steamId: "12345678901234568",
      nickname: "Player Two",
      discord: "playerTwo#1234",
      coCaptain: true
    },
    {
      accountId: 99997,
      steamId: "12345678901234569",
      nickname: "Player Three"
    },
    {
      accountId: 99996,
      steamId: "12345678901234570",
      nickname: "Player Four"
    },
    {
      accountId: 99995,
      steamId: "12345678901234571",
      nickname: "Player Five"
    }
  ]
} satisfies SignupFormValues;

// New org and new team, but no newOrganization and newTeam data
export const invalidSignupData = {
  organizationId: -1,
  teamId: -1,
  teamExternalId: "team-123",
  players: [
    {
      accountId: 1,
      steamId: "12345678901234567",
      nickname: "Player One",
      captain: true
    },
    {
      accountId: 2,
      steamId: "12345678901234568",
      nickname: "Player Two",
      discord: "playerTwo#1234",
      coCaptain: true
    },
    {
      accountId: 3,
      steamId: "12345678901234569",
      nickname: "Player three"
    },
    {
      accountId: 4,
      steamId: "12345678901234570",
      nickname: "Player Four"
    },
    {
      accountId: 5,
      steamId: "12345678901234571",
      nickname: "Player Five"
    }
  ]
};
