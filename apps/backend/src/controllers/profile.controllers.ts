import {
  type UserPolicyAcceptancesPayload,
  type ProfileUpdateValues,
  type RequestWithBody,
  profileSchema,
  type UpdateUserProfile
} from "@eggosystem/types";
import type { Response } from "express";
import z from "zod";
import { getConnection } from "../db/mysqlConnection";
import {
  insertUserPolicyAcceptance,
  updateProfileData,
  updateUserPolicyAcceptance,
  userPolicyAcceptance
} from "../models/profile.models";

export const updateProfile = async (
  req: RequestWithBody<ProfileUpdateValues>,
  res: Response
) => {
  const user = req.auth;
  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const steamId = user.steamId;
  const formData = req.body;

  const privacyPolicyVersion = process.env.PRIVACY_POLICY_VERSION;
  if (!privacyPolicyVersion) {
    throw new Error("Privacy policy version is not set");
  }

  try {
    profileSchema.parse(formData);
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

  const updatedUser = {
    nickname: formData.nickname,
    full_name: formData.full_name,
    work_email: formData.work_email,
    discord: formData.discord ?? null
  } satisfies UpdateUserProfile;

  const userPolicyAcceptancePayload = {
    accepted_privacy_policy: formData.acceptPrivacyPolicy,
    accepted_marketing: formData.acceptMarketing ?? false,
    privacy_policy_version: privacyPolicyVersion
  } satisfies UserPolicyAcceptancesPayload;

  const connection = await getConnection();

  try {
    await connection.beginTransaction();
    // Update Player by steamId
    await updateProfileData(steamId, updatedUser, connection);

    const existingPolicyAcceptance = await userPolicyAcceptance(
      steamId,
      privacyPolicyVersion,
      connection
    );

    if (existingPolicyAcceptance) {
      // If it exists, update the existing record

      await updateUserPolicyAcceptance(
        steamId,
        userPolicyAcceptancePayload,
        connection
      );
      await connection.commit();
      res.status(200).json({
        message: "User policy acceptances updated successfully"
      });
      return;
    }

    await insertUserPolicyAcceptance(
      steamId,
      userPolicyAcceptancePayload,
      connection
    );
    await connection.commit();
    res.status(200).json({
      message: "Profile updated successfully"
    });
  } catch (error: unknown) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
