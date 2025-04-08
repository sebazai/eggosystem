import { z } from "zod";
import { SeasonPlatform } from "@eggosystem/types";

const playerSchema = z
  .object({
    steam_id: z.string().length(17),
    name: z.string().min(1).max(50),
    has_valid_data: z.boolean().optional(),
    is_profile_public: z.boolean().optional(),
    discord: z.string().optional(),
    captain: z.boolean().optional(),
    co_captain: z.boolean().optional()
  })
  .refine(
    (player) =>
      !(player.captain || player.co_captain) || !!player.discord?.trim(),
    {
      message: "Captains and co-captains must provide a Discord username.",
      path: ["discord"]
    }
  );

const newOrganizationSchema = z.preprocess(
  (val) =>
    typeof val === "object" &&
    val !== null &&
    Object.values(val).every((v) => v === "")
      ? undefined // Convert empty object to undefined
      : val,
  z
    .object({
      name: z.string().min(2).max(50),
      organization_code: z.string().min(2).max(50),
      website: z.string().url()
    })
    .optional()
);

const newTeamSchema = z.preprocess(
  (val) =>
    typeof val === "object" &&
    val !== null &&
    Object.values(val).every((v) => v === "")
      ? undefined
      : val,
  z
    .object({
      name: z.string().min(2).max(50)
    })
    .optional()
);

const baseSignupFormSchema = (context: { platform: SeasonPlatform }) =>
  z
    .object({
      organizationId: z.number(),
      newOrganization: newOrganizationSchema.optional(),
      teamId: z.number(),
      teamExternalId: z.string().optional(),
      newTeam: newTeamSchema.optional(),
      players: z
        .array(playerSchema)
        .min(5)
        .max(9)
        .refine(
          (players) => {
            const captains = players.filter((p) => p.captain === true);
            const coCaptains = players.filter((p) => p.co_captain === true);
            return captains.length === 1 && coCaptains.length === 1;
          },
          {
            message: "There must be exactly one captain and one co-captain."
          }
        )
        .refine(
          (players) => {
            const steamIds = new Set(players.map((p) => p.steam_id));
            return steamIds.size === players.length;
          },
          {
            message: "Each player must have a unique Steam ID.",
            path: ["players"]
          }
        ),
      defects: z.string().max(255).optional()
    })
    .refine(
      (data) => {
        if (context.platform !== SeasonPlatform.Kanaliiga) {
          return !!data.teamExternalId;
        }
        return true;
      },
      {
        message: "Team external id is required for this platform.",
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
export type PlayerSchemaType = typeof playerSchema;

export {
  playerSchema,
  newOrganizationSchema,
  newTeamSchema,
  baseSignupFormSchema,
  signupFormSchema
};
