import { postTeamManualPlayerApprovalSchema } from "@eggosystem/types";
import { type Request, type Response } from "express";
import * as z from "zod";
import { addManuallyApprovedPartialSignupForSeason } from "../../models/dashboard/registration.models";

export const addManuallyApprovedPlayersController = async (
  req: Request,
  res: Response
) => {
  try {
    const validatedData = postTeamManualPlayerApprovalSchema.parse(req.body);

    const result =
      await addManuallyApprovedPartialSignupForSeason(validatedData);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
    throw error;
  }
};
