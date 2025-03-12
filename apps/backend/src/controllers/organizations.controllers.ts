import { type Request, type Response } from "express";
import { getOrganizations } from "../models/organization.models";

export const fetchOrganizations = async (req: Request, res: Response) => {
  const allOrgs = await getOrganizations();
  res.json(allOrgs);
};
