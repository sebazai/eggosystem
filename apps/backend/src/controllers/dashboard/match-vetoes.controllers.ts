import { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { getVetoTemplate } from "@eggosystem/types";
import { getMatch } from "../../models/match.models";
import { getTeamIdsForMatch } from "../../models/team-game-score.models";
import { getSeasonMapPoolForMatch } from "../../models/season-active-map-pool.models";
import {
  createMatchVetoSteps,
  countExistingVetoStepsForMatch,
  type CreateVetoStepInput
} from "../../models/match-team-map-veto.models";
import { getConnection } from "../../db/mysqlConnection";
import { convertDatabaseErrorToConflictError } from "../../utils/database-errors";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError
} from "../../utils/errors";

const matchIdParamSchema = z.object({
  match_id: z.coerce.number().int().positive()
});

const vetoStepSchema = z.object({
  team_id: z.number().int().positive(),
  map_id: z.number().int().positive(),
  veto_order: z.number().int().positive()
});

const createVetoStepsBodySchema = z.object({
  steps: z.array(vetoStepSchema).min(1)
});

export const createMatchVetoStepsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.auth?.account_id === undefined) {
    return next(new UnauthorizedError("Not authenticated"));
  }

  const paramsParsed = matchIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return next(paramsParsed.error);
  }
  const matchId = paramsParsed.data.match_id;

  const bodyParsed = createVetoStepsBodySchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return next(bodyParsed.error);
  }
  const { steps } = bodyParsed.data;

  const [match] = await getMatch(matchId);
  if (!match) {
    return next(new NotFoundError(`Match ${matchId} not found`));
  }

  const template = getVetoTemplate(match.best_of);
  if (!template) {
    return next(
      new BadRequestError(`No veto template for best_of=${match.best_of}`)
    );
  }

  if (steps.length !== template.steps.length) {
    return next(
      new BadRequestError(
        `Expected ${template.steps.length} veto steps for BO${match.best_of}, got ${steps.length}`
      )
    );
  }

  const orders = steps.map((s) => s.veto_order).sort((a, b) => a - b);
  const expectedOrders = template.steps.map((s) => s.order);
  if (orders.join(",") !== expectedOrders.join(",")) {
    return next(
      new BadRequestError(
        `veto_order values must be sequential: ${expectedOrders.join(", ")}`
      )
    );
  }

  const matchTeamRows = await getTeamIdsForMatch(matchId);
  if (matchTeamRows.length !== 2) {
    return next(
      new BadRequestError("Match does not have exactly two teams in MatchTeams")
    );
  }
  const allowedTeamIds = new Set(matchTeamRows.map((r) => r.team_id));
  for (const step of steps) {
    if (!allowedTeamIds.has(step.team_id)) {
      return next(
        new BadRequestError(
          `team_id ${step.team_id} is not a participant of match ${matchId}`
        )
      );
    }
  }

  const mapRows = await getSeasonMapPoolForMatch(matchId);
  if (mapRows.length === 0) {
    return next(
      new BadRequestError(`No active map pool found for match ${matchId}`)
    );
  }
  const allowedMapIds = new Set(mapRows.map((m) => m.id));
  for (const step of steps) {
    if (!allowedMapIds.has(step.map_id)) {
      return next(
        new BadRequestError(
          `map_id ${step.map_id} is not in the active map pool for this match`
        )
      );
    }
  }

  const mapIdSet = new Set<number>();
  for (const step of steps) {
    if (mapIdSet.has(step.map_id)) {
      return next(
        new BadRequestError(`Duplicate map_id ${step.map_id} in veto steps`)
      );
    }
    mapIdSet.add(step.map_id);
  }

  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const existing = await countExistingVetoStepsForMatch(matchId, connection);
    if (existing > 0) {
      await connection.rollback();
      return next(
        new ConflictError("Map veto steps already exist for this match")
      );
    }

    const vetoInputs: CreateVetoStepInput[] = steps.map((s) => ({
      match_id: matchId,
      team_id: s.team_id,
      map_id: s.map_id,
      veto_order: s.veto_order
    }));

    const created = await createMatchVetoSteps(
      vetoInputs,
      match.best_of,
      connection
    );

    await connection.commit();
    res.status(201).json({ match_id: matchId, vetoes: created });
  } catch (error) {
    await connection.rollback();
    const conflict = convertDatabaseErrorToConflictError(error);
    if (conflict !== null) {
      return next(conflict);
    }
    throw error;
  } finally {
    connection.release();
  }
};
