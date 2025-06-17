import { type Request, type Response } from "express";
import { getOrganizationTeams } from "../../models/dashboard/organization.models";

export const getOrganizationTeamsController = async (
  req: Request,
  res: Response
) => {
  const orgId = Number(req.params.id);
  const org = await getOrganizationTeams(orgId);
  res.json(org);
};
