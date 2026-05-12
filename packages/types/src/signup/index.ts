import { z } from "zod";
import { SeasonPlatform } from "@eggosystem/types";

const playerSchema = z
  .object({
    accountId: z.number(),
    // Allow any non-empty string to support Steam IDs, nicknames, provider_username, and faceit_nickname
    // Final validation will ensure it's a valid SteamID64 after resolution
    steamId: z.string().min(1),
    nickname: z.string().min(1).max(50),
    hasValidData: z.boolean().optional(),
    hasValidWorkEmail: z.boolean().optional(),
    isEmailVerified: z.boolean().optional(),
    hours: z.number().optional(),
    rank: z.number().optional(),
    externalRank: z.number().optional(),
    discord: z.string().optional(),
    discordLinked: z.boolean().optional(),
    captain: z.boolean().optional(),
    coCaptain: z.boolean().optional()
  })
  .refine(
    (player) =>
      !(player.captain || player.coCaptain) || player.discordLinked === true,
    {
      message:
        "Captains and co-captains must link their Discord account in their profile.",
      path: ["discordLinked"]
    }
  )
  .refine(
    // Validate that steamId is a valid SteamID64 format (17 numeric characters)
    // This allows nicknames during input but ensures final validation requires SteamID64
    (player) => {
      // Allow empty strings (will be caught by min(1) above)
      if (!player.steamId || player.steamId.trim() === "") {
        return false;
      }
      // Check if it's a valid SteamID64 format (17 numeric characters)
      return !isNaN(Number(player.steamId)) && player.steamId.length === 17;
    },
    {
      message:
        "Invalid SteamID - must be a valid SteamID64 or resolvable nickname",
      path: ["steamId"]
    }
  );

const newOrganizationSchema = z
  .object({
    name: z.string().min(2).max(50),
    organization_code: z.string().min(2).max(50),
    website: z.string().url(),
    // Optional image upload data (base64 encoded)
    image_data: z.string().optional(),
    image_filename: z.string().optional()
  })
  .optional();

const newTeamSchema = z
  .object({
    name: z.string().min(2).max(50),
    // Optional image upload data (base64 encoded)
    image_data: z.string().optional(),
    image_filename: z.string().optional()
  })
  .optional();

const teamExternalIdSchema = (platform: SeasonPlatform) => {
  if (platform === SeasonPlatform.FACEIT) {
    return z.string().uuid();
  }
  return z.string().optional();
};

const baseSignupFormSchema = (context: { platform: SeasonPlatform }) =>
  z
    .object({
      organizationId: z.number(),
      newOrganization: newOrganizationSchema.optional(),
      teamId: z.number(),
      teamExternalId: teamExternalIdSchema(context.platform),
      newTeam: newTeamSchema.optional(),
      captainHasReadTermAndConditions: z.literal<boolean>(true, {
        error: () => ({
          message: "You need to be aware of the terms and conditions."
        })
      }),
      players: z
        .array(playerSchema)
        .min(5)
        .max(9)
        .refine(
          (players) => {
            const captains = players.filter((p) => p.captain === true);
            const coCaptains = players.filter((p) => p.coCaptain === true);
            return captains.length === 1 && coCaptains.length === 1;
          },
          {
            message: "There must be exactly one captain and one co-captain."
          }
        )
        .refine(
          (players) => {
            const steamIds = new Set(players.map((p) => p.steamId));
            return steamIds.size === players.length;
          },
          {
            message: "Each player must have a unique Steam ID.",
            path: ["players"]
          }
        )
    })
    .refine(
      (data) => {
        if (context.platform !== SeasonPlatform.Kanaliiga) {
          return (
            typeof data.teamExternalId === "string" &&
            data.teamExternalId.length >= 2 &&
            data.teamExternalId.length <= 50
          );
        }
        return true;
      },
      {
        message: `Team external ID must be between 2 and 50 characters for platform ${context.platform?.toLocaleUpperCase()}.`,
        path: ["teamExternalId"]
      }
    );

const signupFormSchema = (context: { platform: SeasonPlatform }) =>
  baseSignupFormSchema(context)
    .refine(
      (data) => {
        if (data.organizationId === -1) {
          return (
            !!data.newOrganization?.name &&
            !!data.newOrganization?.organization_code &&
            !!data.newOrganization?.website
          );
        }
        return true;
      },
      {
        message:
          "New organization details are required when 'Add new...' is selected.",
        path: ["newOrganization"]
      }
    )
    .refine(
      (data) => {
        if (data.teamId === -1) {
          return !!data.newTeam?.name;
        }
        return true;
      },
      {
        message: "New team details are required when 'Add new...' is selected.",
        path: ["newTeam"]
      }
    );

export type SignupFormValues = z.infer<ReturnType<typeof signupFormSchema>>;
export type SignupPlayerType = z.infer<typeof playerSchema>;
export type SignupNewOrganizationType = z.infer<typeof newOrganizationSchema>;
export type SignupNewTeamType = z.infer<typeof newTeamSchema>;

const createMockSignupPlayer = (
  overrides?: Partial<SignupPlayerType>
): SignupPlayerType => {
  return {
    accountId: 1,
    steamId: "76561198012345678",
    nickname: "Test Player",
    captain: false,
    coCaptain: false,
    discordLinked: false,
    ...overrides
  } satisfies SignupPlayerType;
};

const createMockSignupFormValues = (
  overrides?: Partial<SignupFormValues>,
  playersOverrides?: Partial<SignupPlayerType>[]
): SignupFormValues => {
  // Create default valid players: one captain, one co-captain, three regular players
  const defaultPlayers: SignupPlayerType[] = [
    createMockSignupPlayer({
      accountId: 1,
      steamId: "76561198012345678",
      nickname: "Captain Player",
      captain: true,
      coCaptain: false,
      discordLinked: true
    }),
    createMockSignupPlayer({
      accountId: 2,
      steamId: "76561198012345679",
      nickname: "Co-Captain Player",
      captain: false,
      coCaptain: true,
      discordLinked: true
    }),
    createMockSignupPlayer({
      accountId: 3,
      steamId: "76561198012345680",
      nickname: "Player 3",
      captain: false,
      coCaptain: false,
      discordLinked: false
    }),
    createMockSignupPlayer({
      accountId: 4,
      steamId: "76561198012345681",
      nickname: "Player 4",
      captain: false,
      coCaptain: false,
      discordLinked: false
    }),
    createMockSignupPlayer({
      accountId: 5,
      steamId: "76561198012345682",
      nickname: "Player 5",
      captain: false,
      coCaptain: false,
      discordLinked: false
    })
  ];

  // If playersOverrides is provided, merge with defaults (partial replacement)
  const players =
    playersOverrides && playersOverrides.length > 0
      ? defaultPlayers.map((defaultPlayer, index) => {
          const override = playersOverrides[index];
          return override
            ? createMockSignupPlayer({ ...defaultPlayer, ...override })
            : defaultPlayer;
        })
      : defaultPlayers;

  return {
    organizationId: 1,
    teamId: 1,
    teamExternalId: "12345678-1234-1234-1234-123456789abc",
    newOrganization: undefined,
    newTeam: undefined,
    captainHasReadTermAndConditions: true,
    players,
    ...overrides
  } satisfies SignupFormValues;
};

export {
  createMockSignupFormValues,
  playerSchema,
  newOrganizationSchema,
  newTeamSchema,
  baseSignupFormSchema,
  signupFormSchema
};

export * from "./SignupForm.test-utils";
export * from "./requirements";
