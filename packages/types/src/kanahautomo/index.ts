import { z } from "zod";
import { Organizations } from "../db";

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
      rocketLeague: z.boolean(),
      dota: z.boolean()
    }),
    acceptedTerms: z.boolean().refine((val) => val, {
      message: "You must accept the terms and conditions"
    })
  })
  .refine(
    (data) => {
      const hasValidOrgId =
        data.organizationId !== undefined && data.organizationId > 0;
      const isAddingNewOrg = data.organizationId === -1;
      return hasValidOrgId || isAddingNewOrg;
    },
    {
      message: "Please select an existing organization or create a new one.",
      path: ["organizationId"]
    }
  )
  .refine(
    (data) => {
      // Must have at least one game type selected
      const gameTypes = data.gameTypes;
      return (
        gameTypes.cs ||
        gameTypes.pubgSquad ||
        gameTypes.csWingman ||
        gameTypes.pubgDuo ||
        gameTypes.rocketLeague ||
        gameTypes.dota
      );
    },
    {
      message: "Please select at least one game type",
      path: ["gameTypes"]
    }
  );

export type KanahautomoFormData = z.infer<typeof kanahautomoSchema>;

export interface KanahautomoOrganizationStatus {
  organization_id: Organizations["id"];
  organization_name: Organizations["name"];
  count: number;
}
