import { type Request, type Response } from "express";
import {
  getOrganizations,
  getOrganizationById,
  getOrganizationTeams
} from "../models/organization.models";

export const fetchOrganizations = async (req: Request, res: Response) => {
  const searchParams = req.query.q?.toString();
  const allOrgs = await getOrganizations(searchParams);
  res.json(allOrgs);
};

export const fetchOrganizationById = async (req: Request, res: Response) => {
  const orgId = req.params.id;
  const org = await getOrganizationById(orgId);
  res.json(org);
};

export const fetchOrganizationTeams = async (req: Request, res: Response) => {
  const orgId = req.params.id;
  const org = await getOrganizationTeams(orgId);
  res.json(org);
};
