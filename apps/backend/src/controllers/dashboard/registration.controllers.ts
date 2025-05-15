import { type Request, type Response } from "express";

export const addManuallyApprovedPlayers = async (
  req: Request,
  res: Response
) => {
  const formData = req.body;
  console.log(formData);
  res.json({});
};
