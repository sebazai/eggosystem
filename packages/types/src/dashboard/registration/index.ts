import * as z from "zod";

export const CREATE_NEW_TEAM_VALUE = "__create__";

export const teamManualPlayerApprovalFormSchema = z
  .object({
    teamId: z.string().min(1, "Team is required"),
    captainSteamId: z.string().min(1, "Captain Steam ID is required"),
    acceptedPlayerSteamId: z
      .string()
      .min(1, "Accepted Player Steam ID is required"),
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
