import * as z from "zod";

export const CREATE_NEW_VALUE = "__create__";

export const teamManualPlayerApprovalFormSchema = z
  .object({
    teamId: z.string().min(1, "Team is required"),
    organizationId: z.string().min(1, "Organization is required"),
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
    if (data.teamId === CREATE_NEW_VALUE) {
      if (data.organizationId === CREATE_NEW_VALUE) {
        if (!data.organizationName?.trim()) {
          ctx.addIssue({
            path: ["organizationName"],
            code: z.ZodIssueCode.custom,
            message: "Organization name is required"
          });
        }
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

const baseSchema = {
  captainSteamId: z
    .string()
    .min(17, "Captain Steam ID should be 17 numbers")
    .max(17, "Captain Steam ID should be 17 numbers"),
  acceptedPlayerSteamIds: z
    .array(
      z
        .string()
        .min(17, "Steam ID should be 17 numbers")
        .max(17, "Steam ID should be 17 numbers")
    )
    .min(1, "At least one player must be added")
};

const existingTeamSchema = z.object({
  ...baseSchema,
  type: z.literal("existing"),
  teamId: z.number().min(1, "Team is required")
});

export type ExistingTeamManualApprovalType = z.infer<typeof existingTeamSchema>;

const newTeamSchema = z.object({
  ...baseSchema,
  type: z.literal("new-team"),
  newTeamName: z.string().min(1, "Team name is required"),
  organizationId: z.number().min(1, "Organization is required")
});

export type NewTeamManualApprovalType = z.infer<typeof newTeamSchema>;

const newTeamAndOrgSchema = z.object({
  ...baseSchema,
  type: z.literal("new-team-and-org"),
  newTeamName: z.string().min(1, "Team name is required"),
  newOrganizationName: z.string().min(1, "Organization name is required")
});

export type NewTeamAndOrgManualApprovalType = z.infer<
  typeof newTeamAndOrgSchema
>;

export const postTeamManualPlayerApprovalSchema = z.discriminatedUnion("type", [
  existingTeamSchema,
  newTeamSchema,
  newTeamAndOrgSchema
]);

export type PostTeamManualPlayerApprovalSchemaType = z.infer<
  typeof postTeamManualPlayerApprovalSchema
>;
