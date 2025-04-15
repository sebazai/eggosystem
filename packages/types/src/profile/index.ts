import { z } from "zod";

const allowedFullNameRegex =
  /^\p{L}+(?:-\p{L}+)? \p{L}+(?:-\p{L}+)?(?: \p{L}+(?:-\p{L}+)?){0,1}$/u;

export const accountSchema = z
  .object({
    nickname: z.string().min(2, "Nickname is required"),
    full_name: z
      .string()
      .min(2)
      .refine((val) => !val || allowedFullNameRegex.test(val), {
        message:
          "Full name must contain a first name and a last name, separated by a space."
      }),
    work_email: z
      .string()
      .optional()
      .or(z.literal("")) // allow empty strings
      .refine((val) => !val || z.string().email().safeParse(val).success, {
        message: "Invalid work email"
      }),
    email: z
      .string()
      .optional()
      .or(z.literal("")) // allow empty strings
      .refine((val) => !val || z.string().email().safeParse(val).success, {
        message: "Invalid email"
      }),
    discord: z.string().optional(),
    acceptPrivacyPolicy: z.boolean().refine((val) => val === true, {
      message: "You must accept the privacy policy"
    }),
    acceptMarketing: z.boolean().optional()
  })
  .refine((data) => data.work_email || data.email, {
    message: "Either work email or personal email is required",
    path: ["work_email"]
  });

export type AccountUpdateValues = z.infer<typeof accountSchema>;
export * from "./UpdateUserPolicyAcceptances.interface";
export * from "./UpdateUserProfile.interface";
