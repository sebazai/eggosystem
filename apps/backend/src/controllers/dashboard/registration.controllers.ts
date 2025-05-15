import { postTeamManualPlayerApprovalSchema } from "@eggosystem/types";
import { type Request, type Response } from "express";
import * as z from "zod";
import { handlePreApprovedRegistration } from "../../services/dashboard/registration.services";

export const addManuallyApprovedPlayers = async (
  req: Request,
  res: Response
) => {
  try {
    const validatedData = postTeamManualPlayerApprovalSchema.parse(req.body);

    await handlePreApprovedRegistration(validatedData);

    res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }
  }
};
