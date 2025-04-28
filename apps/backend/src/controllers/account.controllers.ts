import {
  type AccountUpdateValues,
  type RequestWithBody,
  accountSchema
} from "@eggosystem/types";
import type { Response } from "express";
import z from "zod";
import { updateAccount } from "../models/account.models";

export const updateAccountProfileController = async (
  req: RequestWithBody<AccountUpdateValues>,
  res: Response
) => {
  const user = req.auth;
  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const accountId = user.account_id;
  const formData = req.body;

  const privacyPolicyVersion = process.env.PRIVACY_POLICY_VERSION;
  if (!privacyPolicyVersion) {
    throw new Error("Privacy policy version is not set");
  }

  try {
    accountSchema.parse(formData);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Invalid profile data",
        errors: error.flatten()
      });
      return;
    }
    throw error;
  }

  const result = await updateAccount(accountId, formData, privacyPolicyVersion);
  res.status(200).json(result);
};
