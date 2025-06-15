import * as z from "zod";

export const CREATE_NEW_VALUE = "__create__";

export const manualPlayerApprovalFormSchema = z
  .object({
    teamId: z.string().optional(),
    organizationId: z.string().optional(),
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
    organizationCode: z.string().optional(),
    organizationWebsite: z.string().url().optional(),
    newTeamName: z.string().optional(),
    ticketId: z.string().optional(),
    details: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.teamId === CREATE_NEW_VALUE) {
      if (!data.newTeamName?.trim()) {
        ctx.addIssue({
          path: ["newTeamName"],
          code: z.ZodIssueCode.custom,
          message: "Team name is required"
        });
      }
    }
    if (data.organizationId === CREATE_NEW_VALUE) {
      if (!data.organizationName?.trim()) {
        ctx.addIssue({
          path: ["organizationName"],
          code: z.ZodIssueCode.custom,
          message: "Organization name is required"
        });
      }
      if (!data.organizationCode?.trim()) {
        ctx.addIssue({
          path: ["organizationCode"],
          code: z.ZodIssueCode.custom,
          message: "Organization code is required"
        });
      }
      if (!data.organizationWebsite?.trim()) {
        ctx.addIssue({
          path: ["organizationWebsite"],
          code: z.ZodIssueCode.custom,
          message: "Organization website is required"
        });
      }
    }
    if (!data.teamId && !data.organizationId) {
      ctx.addIssue({
        path: ["organizationId"],
        code: z.ZodIssueCode.custom,
        message: "Either Team or Organization has to be selected"
      });
      ctx.addIssue({
        path: ["teamId"],
        code: z.ZodIssueCode.custom,
        message: "Either Team or Organization has to be selected"
      });
    }
  });

export type ManualPlayerApprovalFormSchemaType = z.infer<
  typeof manualPlayerApprovalFormSchema
>;

const baseSchema = {
  acceptedPlayerSteamIds: z
    .array(
      z
        .string()
        .min(17, "Steam ID should be 17 numbers")
        .max(17, "Steam ID should be 17 numbers")
    )
    .min(1, "At least one player must be added"),
  ticketId: z.string().optional(),
  details: z.string().optional()
};

const existingTeamSchema = z.object({
  ...baseSchema,
  type: z.literal("existing"),
  teamId: z.number()
});

export type ExistingTeamManualApprovalType = z.infer<typeof existingTeamSchema>;

const newTeamSchema = z.object({
  ...baseSchema,
  type: z.literal("new-team"),
  newTeamName: z.string().min(1, "Team name is required"),
  organizationId: z.number().optional()
});

export type NewTeamManualApprovalType = z.infer<typeof newTeamSchema>;

const newTeamAndOrgSchema = z.object({
  ...baseSchema,
  type: z.literal("new-team-and-org"),
  newTeamName: z.string().min(1, "Team name is required"),
  newOrganizationName: z.string().min(1, "Organization name is required"),
  newOrganizationCode: z.string(),
  newOrganizationWebsite: z.string().url()
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

export const seasonPlayerRankFormSchema = z
  .object({
    steam_id: z
      .string()
      .min(1, "Steam ID is required")
      .regex(/^\d+$/, "Steam ID must be numeric"),

    external_elo: z.number().optional(),
    cs2_rank: z.number().optional(),
    cs_hours: z.number().optional()
  })
  .refine(
    (data) =>
      (data.external_elo !== undefined && data.external_elo !== 0) ||
      (data.cs2_rank !== undefined && data.cs2_rank !== 0),
    {
      message: "At least one of ELO or CS2 Rank must be provided and non-zero",
      path: ["external_elo"]
    }
  );

export type SeasonPlayerRankFormValues = z.infer<
  typeof seasonPlayerRankFormSchema
>;
