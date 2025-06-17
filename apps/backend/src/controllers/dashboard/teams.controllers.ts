import { type Response } from "express";
import type { RequestWithParams } from "@eggosystem/types";
import { getTeamOrganization } from "../../models/dashboard/team.models";

export const getTeamOrganizationController = async (
  req: RequestWithParams<{ id: string }>,
  res: Response
) => {
  const teamId = Number(req.params.id);
  const organization = await getTeamOrganization(teamId);
  res.json(organization);
};
