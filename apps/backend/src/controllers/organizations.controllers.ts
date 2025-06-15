import { type Request, type Response } from "express";
import {
  getOrganizations,
  getOrganizationById,
  getOrganizationApprovedTeams,
  getOrganizationTeamTrophies,
  getOrganizationTeams
} from "../models/organization.models";
import { NotFoundError } from "../utils/errors";
import { type RequestWithParams } from "@eggosystem/types";

export const getOrgs = async (req: Request, res: Response) => {
  const searchParams = req.query.q?.toString();
  const allOrgs = await getOrganizations(searchParams);
  res.json(allOrgs);
};

export const getOrgById = async (req: Request, res: Response) => {
  const orgId = Number(req.params.id);
  const org = await getOrganizationById(orgId);
  if (org.length !== 1) {
    throw new NotFoundError("Organization not found");
  }
  res.json(org[0]);
};

export const getOrganizationApprovedTeamsController = async (
  req: Request,
  res: Response
) => {
  const orgId = Number(req.params.id);
  const org = await getOrganizationApprovedTeams(orgId);
  res.json(org);
};

export const getOrganizationTeamsController = async (
  req: Request,
  res: Response
) => {
  const orgId = Number(req.params.id);
  const org = await getOrganizationTeams(orgId);
  res.json(org);
};

export const getOrgTeamTrophiesController = async (
  req: RequestWithParams<{ id: string }>,
  res: Response
) => {
  const orgId = Number(req.params.id);
  const trophies = await getOrganizationTeamTrophies(orgId);
  res.json(trophies);
};
