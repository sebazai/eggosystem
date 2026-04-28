import { type NextFunction, type Request, type Response } from "express";
import { z, ZodError } from "zod";
import { type FlaggedMatches } from "@eggosystem/types";
import { getMatchGameMetaForTeamScores } from "../../models/match-game.models";
import { getMatch } from "../../models/match.models";
import { deleteMatchTeamMapVetoesByMatchId } from "../../models/match-team-map-veto.models";
import {
  getTeamIdsForMatch,
  listTeamGameScoresByMatchGameId,
  saveStaffManualTeamGameScores,
  validateCs2TeamGameScorePair
} from "../../models/team-game-score.models";
import { logger } from "../../utils/app-logger";
import { redisClient } from "../../utils/redisClient";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError
} from "../../utils/errors";

const matchIdParamSchema = z.object({
  match_id: z.coerce.number().int().positive()
});

const matchGameIdParamSchema = z.object({
  match_game_id: z.coerce.number().int().positive()
});

const teamInputSchema = z.object({
  team_id: z.coerce.number().int().positive(),
  starting_side: z.enum(["T", "CT"]),
  score: z.number().int().min(0),
  halftime_score: z.number().int().min(0),
  overtime_score: z.number().int().min(0)
});

const putTeamGameScoresBodySchema = z
  .object({
    teams: z.array(teamInputSchema).length(2)
  })
  .superRefine((data, ctx) => {
    const a = data.teams[0];
    const b = data.teams[1];
    if (a && b && a.team_id === b.team_id) {
      ctx.addIssue({
        code: "custom",
        message: "teams must be two different team_id values",
        path: ["teams", 1, "team_id"]
      });
    }
    const sides = new Set(data.teams.map((t) => t.starting_side));
    if (sides.size !== 2) {
      ctx.addIssue({
        code: "custom",
        message: "must include one team with starting_side T and one with CT",
        path: ["teams"]
      });
    }
  });

export const getFlaggedMatchesController = async (
  req: Request,
  res: Response
) => {
  const keys = await redisClient.keys("match:invalid_players:*");
  const matches = await Promise.all(
    keys.map(async (key) => {
      const value = await redisClient.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as FlaggedMatches;
    })
  );
  res.json({
    matches: matches.filter((match): match is FlaggedMatches => match !== null)
  });
};

export const getManualTeamGameScoresController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.auth?.account_id === undefined) {
    return next(new UnauthorizedError("Not authenticated"));
  }
  const parsed = matchGameIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return next(parsed.error);
  }
  const matchGameId = parsed.data.match_game_id;

  const meta = await getMatchGameMetaForTeamScores(matchGameId);
  if (!meta) {
    return next(new NotFoundError("Match game not found"));
  }
  const matchTeamRows = await getTeamIdsForMatch(meta.match_id);
  if (matchTeamRows.length !== 2) {
    return next(
      new BadRequestError("Match does not have exactly two teams in MatchTeams")
    );
  }
  const teams = await listTeamGameScoresByMatchGameId(matchGameId);
  res.json({
    match_id: meta.match_id,
    match_game_id: matchGameId,
    regulation_rounds: meta.regulation_rounds,
    team_game_scores_staff_lock: Boolean(meta.team_game_scores_staff_lock),
    match_team_ids: matchTeamRows.map((r) => r.team_id),
    teams
  });
};

export const putManualTeamGameScoresController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.auth?.account_id === undefined) {
    return next(new UnauthorizedError("Not authenticated"));
  }
  const pParams = matchGameIdParamSchema.safeParse(req.params);
  if (!pParams.success) {
    return next(pParams.error);
  }
  const matchGameId = pParams.data.match_game_id;
  const parsed = putTeamGameScoresBodySchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn("Manual team game scores body validation failed", {
      issues: parsed.error.flatten()
    });
    return next(parsed.error);
  }
  const [a, b] = parsed.data.teams;
  const tRow = a.starting_side === "T" ? a : b.starting_side === "T" ? b : null;
  const ctRow =
    a.starting_side === "CT" ? a : b.starting_side === "CT" ? b : null;
  if (!tRow || !ctRow) {
    return next(
      new ZodError([
        {
          code: "custom",
          path: ["teams"],
          message: "must include one team with starting_side T and one with CT"
        }
      ])
    );
  }

  const meta = await getMatchGameMetaForTeamScores(matchGameId);
  if (!meta) {
    return next(new NotFoundError("Match game not found"));
  }
  const matchTeamRows = await getTeamIdsForMatch(meta.match_id);
  if (matchTeamRows.length !== 2) {
    return next(
      new BadRequestError("Match does not have exactly two teams in MatchTeams")
    );
  }
  const allowed = new Set(matchTeamRows.map((r) => r.team_id));
  if (!allowed.has(tRow.team_id) || !allowed.has(ctRow.team_id)) {
    return next(
      new ZodError([
        {
          code: "custom",
          path: ["teams"],
          message:
            "team_id values must be the two teams in MatchTeams for this match"
        }
      ])
    );
  }
  if (tRow.team_id === ctRow.team_id) {
    return next(
      new ZodError([
        {
          code: "custom",
          path: ["teams"],
          message: "T and CT entries must be different team_id values"
        }
      ])
    );
  }
  const regulationRounds = meta.regulation_rounds;
  validateCs2TeamGameScorePair(
    {
      score: tRow.score,
      halftime_score: tRow.halftime_score,
      overtime_score: tRow.overtime_score
    },
    {
      score: ctRow.score,
      halftime_score: ctRow.halftime_score,
      overtime_score: ctRow.overtime_score
    },
    regulationRounds
  );

  await saveStaffManualTeamGameScores({
    matchId: meta.match_id,
    matchGameId,
    t: tRow,
    ct: ctRow
  });

  const teams = await listTeamGameScoresByMatchGameId(matchGameId);
  res.json({
    match_id: meta.match_id,
    match_game_id: matchGameId,
    regulation_rounds: meta.regulation_rounds,
    team_game_scores_staff_lock: true,
    match_team_ids: matchTeamRows.map((r) => r.team_id),
    teams
  });
};

export const deleteMatchTeamMapVetoesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const parsed = matchIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return next(parsed.error);
  }
  const matchId = parsed.data.match_id;

  const matches = await getMatch(matchId);
  if (!matches || matches.length === 0) {
    return next(new NotFoundError("Match not found"));
  }

  await deleteMatchTeamMapVetoesByMatchId(matchId);
  res.status(204).end();
};
