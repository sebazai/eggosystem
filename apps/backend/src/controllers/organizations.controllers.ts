import { type Request, type Response } from "express";
import { getOrganizations } from "../models/organization.models";

export const fetchOrganizations = async (req: Request, res: Response) => {
  const searchParams = req.query.q?.toString() || "";
  const allOrgs = await getOrganizations(searchParams);
  res.json(allOrgs);
};
