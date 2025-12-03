import { type Response, type NextFunction } from "express";
import { type RequestWithParams } from "@eggosystem/types";
import {
  getSeasonChampionships,
  getSeasonTeamsWithRoster
} from "../../models/dashboard/faceit-validation.models";
import { getChampionshipTeamsWithMembers } from "../../services/faceit.services";
import { BadRequestError, NotFoundError } from "../../utils/errors";
import { logger } from "../../utils/app-logger";
import { redisClient, expireIn30Days } from "../../utils/redisClient";
import { getSeasonDetailsById } from "../../models/season.models";
import type {
  FaceitTeamRosterComparison,
  FaceitPlayer,
  HubPlayer,
  MatchingPlayer
} from "@eggosystem/types";

/**
 * Validates rosters for ALL championships in a season
 * Starting point: FaceIt championship subscriptions → match to HUB teams
 */
export const validateAllSeasonChampionships = async (
  req: RequestWithParams<{ seasonId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const seasonId = parseInt(req.params.seasonId, 10);
  const forceRefresh = req.query.refresh === "true";

  if (isNaN(seasonId)) {
    next(new BadRequestError("Invalid season ID"));
    return;
  }

  const cacheKey = `faceit-roster-validation-all-${seasonId}`;

  try {
    // Check cache first unless force refresh is requested
    if (!forceRefresh) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info(
          `[FaceIT Validation] Returning cached validation for all championships in season ${seasonId}`
        );
        res.status(200).json(JSON.parse(cached));
        return;
      }
    } else {
      logger.info(
        `[FaceIT Validation] Force refresh requested, clearing cache for season ${seasonId}`
      );
      await redisClient.del(cacheKey);
    }

    const season = await getSeasonDetailsById(seasonId);

    if (!season) {
      next(new NotFoundError("Season not found"));
      return;
    }

    if (season.platform !== "faceit") {
      next(
        new BadRequestError(
          "This validation is only available for FaceIt seasons"
        )
      );
      return;
    }

    // Get all championships for the season
    const championships = await getSeasonChampionships(seasonId);

    if (championships.length === 0) {
      logger.warn(
        `[FaceIT Validation] No championships found for season ${seasonId}`
      );
      res.status(200).json({
        season_id: seasonId,
        season_name: season.name,
        championships: []
      });
      return;
    }

    // Get all HUB teams for this season (for lookup)
    const hubTeams = await getSeasonTeamsWithRoster(seasonId);
    logger.info(
      `[FaceIT Validation] Found ${hubTeams.length} teams in HUB for season ${seasonId}`
    );

    // Create a map of HUB teams by their FaceIt team ID
    const hubTeamsMap = new Map(
      hubTeams
        .filter((t) => t.external_platform_id)
        .map((team) => [team.external_platform_id!, team])
    );

    // Validate ALL championships
    const championshipResults = [];

    for (const championship of championships) {
      logger.info(
        `[FaceIT Validation] Fetching teams from FaceIt championship: ${championship.championship_id} (${championship.stage_name})`
      );

      const faceitTeams = await getChampionshipTeamsWithMembers(
        championship.championship_id
      );

      logger.info(
        `[FaceIT Validation] Found ${faceitTeams.length} teams in championship ${championship.championship_name}`
      );

      // Validate each FaceIt team in this championship
      const comparisons: FaceitTeamRosterComparison[] = [];
      let totalRuleViolations = 0;
      let totalNotifications = 0;
      let teamsWithIssues = 0;

      for (const faceitTeam of faceitTeams) {
        const hubTeam = hubTeamsMap.get(faceitTeam.team_id);

        if (!hubTeam) {
          logger.warn(
            `[FaceIT Validation] FaceIt team ${faceitTeam.team_name} (ID: ${faceitTeam.team_id}) not found in HUB`
          );
          continue;
        }

        // Compare rosters
        const hubSteamIds = new Set(hubTeam.players.map((p) => p.steam_id));
        const faceitSteamIds = new Set(
          faceitTeam.members
            .filter((m) => m.steam_id !== null)
            .map((m) => m.steam_id as string)
        );

        // RULE VIOLATIONS: Players in FaceIt but NOT in HUB
        const playersInFaceitNotInHub: FaceitPlayer[] = [];
        for (const member of faceitTeam.members) {
          if (member.steam_id && !hubSteamIds.has(member.steam_id)) {
            playersInFaceitNotInHub.push({
              steam_id: member.steam_id,
              nickname: member.nickname,
              faceit_user_id: member.faceit_user_id
            });
          }
        }

        // NOTIFICATIONS: Players in HUB but NOT in FaceIt
        const playersInHubNotInFaceit: HubPlayer[] = [];
        for (const player of hubTeam.players) {
          if (!faceitSteamIds.has(player.steam_id)) {
            playersInHubNotInFaceit.push({
              steam_id: player.steam_id,
              nickname: player.nickname,
              role: player.role
            });
          }
        }

        // Matching players
        const matchingPlayers: MatchingPlayer[] = [];
        for (const player of hubTeam.players) {
          if (faceitSteamIds.has(player.steam_id)) {
            const faceitMember = faceitTeam.members.find(
              (m) => m.steam_id === player.steam_id
            );
            matchingPlayers.push({
              steam_id: player.steam_id,
              nickname: player.nickname,
              faceit_nickname: faceitMember?.nickname,
              role: player.role
            });
          }
        }

        const hasIssues = playersInFaceitNotInHub.length > 0;

        if (hasIssues) {
          teamsWithIssues++;
          totalRuleViolations += playersInFaceitNotInHub.length;
        }

        totalNotifications += playersInHubNotInFaceit.length;

        comparisons.push({
          team_id: hubTeam.team_id,
          team_name: hubTeam.team_name,
          faceit_team_id: faceitTeam.team_id,
          faceit_team_url: `https://www.faceit.com/en/teams/${faceitTeam.team_id}`,
          championship_id: championship.championship_id,
          has_mismatches: hasIssues,
          players_in_faceit_not_in_hub: playersInFaceitNotInHub,
          players_in_hub_not_in_faceit: playersInHubNotInFaceit,
          matching_players: matchingPlayers
        });
      }

      championshipResults.push({
        championship_id: championship.championship_id,
        championship_name: championship.championship_name,
        stage_id: championship.stage_id,
        stage_name: championship.stage_name,
        teams: comparisons,
        summary: {
          total_teams: comparisons.length,
          teams_with_issues: teamsWithIssues,
          total_rule_violations: totalRuleViolations,
          total_unplayable_players: totalNotifications
        }
      });
    }

    // Calculate overall summary
    const overallSummary = {
      total_teams: championshipResults.reduce(
        (sum, c) => sum + c.summary.total_teams,
        0
      ),
      teams_with_issues: championshipResults.reduce(
        (sum, c) => sum + c.summary.teams_with_issues,
        0
      ),
      total_rule_violations: championshipResults.reduce(
        (sum, c) => sum + c.summary.total_rule_violations,
        0
      ),
      total_unplayable_players: championshipResults.reduce(
        (sum, c) => sum + c.summary.total_unplayable_players,
        0
      )
    };

    const result = {
      season_id: seasonId,
      season_name: season.name,
      championships: championshipResults,
      summary: overallSummary
    };

    logger.info(
      `[FaceIT Validation] Validation complete for ${championshipResults.length} championships: ${overallSummary.teams_with_issues} teams with rule violations`
    );

    // Cache the result for 30 days
    await redisClient.set(
      cacheKey,
      JSON.stringify(result),
      "EX",
      expireIn30Days
    );

    res.status(200).json(result);
  } catch (error) {
    logger.error(
      `[FaceIT Validation] Error validating season ${seasonId}:`,
      error
    );
    next(error);
  }
};
