import * as z from "zod";

export const CREATE_NEW_TEAM_VALUE = "__create__";

export const teamManualPlayerApprovalFormSchema = z
  .object({
    teamId: z.string().min(1, "Team is required"),
    captainSteamId: z
      .string()
      .min(17, "Captain Steam ID should be 17 numbers")
      .max(17, "Captain Steam ID should be 17 numbers"),
    acceptedPlayerSteamIds: z
      .array(
        z.object({
          name: z
            .string()
            .min(17, "Steam ID should be 17 numbers")
            .max(17, "Steam ID should be 17 numbers")
        })
      )
      .min(1, "At least one player must be added"),
    organizationName: z.string().optional(),
    newTeamName: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.teamId === CREATE_NEW_TEAM_VALUE) {
      if (!data.organizationName?.trim()) {
        ctx.addIssue({
          path: ["organizationName"],
          code: z.ZodIssueCode.custom,
          message: "Organization name is required"
        });
      }
      if (!data.newTeamName?.trim()) {
        ctx.addIssue({
          path: ["newTeamName"],
          code: z.ZodIssueCode.custom,
          message: "Team name is required"
        });
      }
    }
  });

export type TeamManualPlayerApprovalFormSchemaType = z.infer<
  typeof teamManualPlayerApprovalFormSchema
>;

export type NewTeamPayload = {
  captainSteamId: string;
  acceptedPlayerSteamId: string;
  organizationName: string;
  newTeamName: string;
};

export const isNewTeamPayload = (
  payload: unknown
): payload is NewTeamPayload => {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "organizationName" in payload &&
    typeof (payload as { organizationName: unknown }).organizationName ===
      "string" &&
    "newTeamName" in payload &&
    typeof payload.newTeamName === "string"
  );
};
