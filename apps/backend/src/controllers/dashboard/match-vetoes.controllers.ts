import { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import {
  getDefaultAdminVetoBestOf,
  getExpectedVetoActingTeamId,
  getVetoTemplate,
  type Match
} from "@eggosystem/types";
import { updateMatchStatusByMatchId } from "../../models/match.models";
import { getTeamIdsForMatch } from "../../models/team-game-score.models";
import { getSeasonMapPoolForMatch } from "../../models/season-active-map-pool.models";
import { getMatchVetoSeasonMeta } from "../../models/match-veto-context.models";
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
  vote_starter_team_id: z.number().int().positive(),
  steps: z.array(vetoStepSchema).min(1),
  /** When set (BO1–BO5), veto template must match this format; omit to use season-aware default. */
  best_of: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(5)])
    .optional()
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
  const {
    steps,
    vote_starter_team_id: voteStarterTeamId,
    best_of: bodyBestOf
  } = bodyParsed.data;

  const meta = await getMatchVetoSeasonMeta(matchId);
  if (!meta) {
    return next(new NotFoundError(`Match ${matchId} not found`));
  }

  const defaultVetoBestOf = getDefaultAdminVetoBestOf({
    storedBestOf: meta.stored_best_of,
    stage: meta.stage,
    isRoundRobinBo2As2xBo1: meta.is_round_robin_bo2_as_2xbo1
  });
  const effectiveBestOf = bodyBestOf ?? defaultVetoBestOf;

  const template = getVetoTemplate(effectiveBestOf);
  if (!template) {
    return next(
      new BadRequestError(`No veto template for best_of=${effectiveBestOf}`)
    );
  }

  if (steps.length !== template.steps.length) {
    return next(
      new BadRequestError(
        `Expected ${template.steps.length} veto steps for BO${effectiveBestOf}, got ${steps.length}`
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
  const orderedMatchTeams: readonly [number, number] = [
    matchTeamRows[0].team_id,
    matchTeamRows[1].team_id
  ];
  const allowedTeamIds = new Set(matchTeamRows.map((r) => r.team_id));
  if (!allowedTeamIds.has(voteStarterTeamId)) {
    return next(
      new BadRequestError(
        `vote_starter_team_id ${voteStarterTeamId} is not a participant of match ${matchId}`
      )
    );
  }
  for (const step of steps) {
    if (!allowedTeamIds.has(step.team_id)) {
      return next(
        new BadRequestError(
          `team_id ${step.team_id} is not a participant of match ${matchId}`
        )
      );
    }
  }

  for (const step of steps) {
    const templateStepDef = template.steps.find(
      (s) => s.order === step.veto_order
    );
    if (templateStepDef === undefined) {
      return next(
        new BadRequestError(
          `Invalid veto_order ${step.veto_order} for template (${template.steps.map((x) => x.order).join(", ")})`
        )
      );
    }
    const expectedTeamId = getExpectedVetoActingTeamId(
      step.veto_order,
      voteStarterTeamId,
      orderedMatchTeams,
      templateStepDef.action
    );
    if (expectedTeamId === null) {
      return next(
        new BadRequestError(
          `vote_starter_team_id ${voteStarterTeamId} is not a participant of match ${matchId}`
        )
      );
    }
    if (step.team_id !== expectedTeamId) {
      return next(
        new BadRequestError(
          `veto_order ${step.veto_order} must be performed by team_id ${expectedTeamId} ` +
            `(alternating veto with vote_starter_team_id ${voteStarterTeamId}), got ${step.team_id}`
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
      effectiveBestOf,
      connection
    );

    const terminalStatuses = new Set<Match["status"]>([
      "FINISHED",
      "ABORTED",
      "CANCELLED",
      "FORFEIT"
    ] satisfies readonly Match["status"][]);
    if (!terminalStatuses.has(meta.status)) {
      await updateMatchStatusByMatchId(
        matchId,
        "ONGOING" satisfies Match["status"],
        connection
      );
    }

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
