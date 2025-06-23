import { z } from "zod";

export const kanahautomoSchema = z
  .object({
    organizationId: z.number().optional(),
    newOrganization: z
      .object({
        name: z
          .string()
          .min(2, "Organization name must be at least 2 characters"),
        organization_code: z
          .string()
          .min(2, "Business ID must be at least 2 characters"),
        website: z.string().url("Please enter a valid website URL")
      })
      .optional(),
    gameTypes: z.object({
      cs: z.boolean(),
      pubgSquad: z.boolean(),
      csWingman: z.boolean(),
      pubgDuo: z.boolean(),
      rocketLeague: z.boolean()
    }),
    acceptedTerms: z.boolean()
  })
  .refine(
    (data) => {
      // Must have exactly one: either organizationId OR newOrganization
      const hasOrgId = data.organizationId && data.organizationId > 0;
      const hasNewOrg =
        data.newOrganization &&
        data.newOrganization.name &&
        data.newOrganization.organization_code &&
        data.newOrganization.website;

      return !hasOrgId && !hasNewOrg;
    },
    {
      message:
        "Please select an existing organization OR create a new one (not both)",
      path: ["organizationId"]
    }
  );

export type KanahautomoFormData = z.infer<typeof kanahautomoSchema>;
