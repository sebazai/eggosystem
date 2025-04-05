import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Nickname is required"),
  player_name: z.string().min(2, "Player full name is required"),
  work_email: z.string().email("Invalid email"),
  discord: z.string().optional(),
  acceptPrivacyPolicy: z.boolean().refine((val) => val === true, {
    message: "You must accept the privacy policy"
  }),
  acceptMarketing: z.boolean().optional()
});

export type ProfileUpdateValues = z.infer<typeof profileSchema>;
export * from "./UpdateUserPolicyAcceptances.interface";
export * from "./UpdateUserProfile.interface";
