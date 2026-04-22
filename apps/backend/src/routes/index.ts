import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth.middleware";
import { corsMiddleware } from "../middlewares/cors.middleware";
import appRouter from "./v1/app.routes";
import dashboardRouter from "./v1/dashboard/index";
import authRouter from "./v1/auth.routes";
import playerRouter from "./v1/player.routes";
import matchRouter from "./v1/match.routes";
import organizationRouter from "./v1/organization.routes";
import mapsRouter from "./v1/map.routes";
import filtersRouter from "./v1/filter.routes";
import teamsRouter from "./v1/team.routes";
import seasonsRouter from "./v1/season.routes";
import leaguesRouter from "./v1/league.routes";
import nowRouter from "./v1/now.routes";
import accountRouter from "./v1/account.routes";
import faceitRouter from "./v1/faceit.routes";
import allstarRouter from "./v1/allstar.routes";
import registrationsRouter from "./v1/season-team-registration.routes";
import matchGameRouter from "./v1/match-game.routes";
import discordRouter from "./v1/discord.routes";
import eloRouter from "./v1/elo.routes";
import { checkDiscordHealth } from "../services/discord.services";
import { queueConsumerManager } from "../services/queue-consumer-manager";
import { getPoolStats } from "../db/mysqlConnection";
import {
  verifyEmailController,
  unsubscribeNewsletterController
} from "../controllers/account.controllers";
import { removeReservationByRemovalTokenController } from "../controllers/match-streams.controllers";
import { landingPageStatistics } from "../services/landing-page.services";
import parseQueryFilterParams from "../middlewares/parse-query-filter-params.middleware";
import { cacheResponseMiddleware } from "../middlewares/cache-filtered-queries";
import { BadRequestError } from "../utils/errors";
import kanahautomoRouter from "./v1/kanahautomo.routes";
import stageRouter from "./v1/stage.routes";
import standingsRouter from "./v1/standings.routes";
import casterRouter from "./v1/caster.routes";
import organizerRouter from "./v1/organizer.routes";
import casterApplicationsRouter from "./v1/caster-applications.routes";
import calendarRouter from "./v1/calendar.routes";
import gameRouter from "./v1/game.routes";
import hallOfFameRouter from "./v1/hall-of-fame.routes";
import seasonResultsRouter from "./v1/season-results.routes";

// Create a new Router instance
const v1Router = Router();

// Caster routes
v1Router.use("/casters", casterRouter);

// Apply CORS
v1Router.use("/auth", corsMiddleware, authRouter);

// Public unsubscribe route - must be before authenticated /accounts router
v1Router.get(
  "/accounts/unsubscribe/:token",
  corsMiddleware,
  unsubscribeNewsletterController
);
v1Router.post(
  "/accounts/unsubscribe/:token",
  corsMiddleware,
  unsubscribeNewsletterController
);

v1Router.use("/app", appRouter);
v1Router.use("/accounts", corsMiddleware, authenticateJWT, accountRouter);
v1Router.use("/dashboard", corsMiddleware, authenticateJWT, dashboardRouter);
v1Router.use("/kanahautomo", corsMiddleware, kanahautomoRouter);
v1Router.use("/discord", corsMiddleware, discordRouter);
v1Router.post("/verify-email", corsMiddleware, verifyEmailController);
v1Router.post(
  "/reservations/remove",
  corsMiddleware,
  removeReservationByRemovalTokenController
);
v1Router.get("/reservations/remove", corsMiddleware, (_req, _res, next) => {
  next(
    new BadRequestError(
      "Use POST to remove a reservation.",
      405,
      "Method Not Allowed"
    )
  );
});
v1Router.use("/registrations", corsMiddleware, registrationsRouter);
v1Router.use("/faceit", corsMiddleware, faceitRouter);
v1Router.use("/players", playerRouter);

// Mount the routers
v1Router.use("/calendar", calendarRouter);
v1Router.use("/organizers", organizerRouter);
v1Router.use(
  "/caster-applications",
  corsMiddleware,
  authenticateJWT,
  casterApplicationsRouter
);
v1Router.use("/matches", matchRouter);
v1Router.use("/match-games", matchGameRouter);
v1Router.use("/games", gameRouter);
v1Router.use("/organizations", organizationRouter);
v1Router.use(
  "/filters",
  parseQueryFilterParams,
  cacheResponseMiddleware({
    cachePrefix: "filtered"
  }),
  filtersRouter
);
v1Router.use("/maps", mapsRouter);
v1Router.use("/teams", teamsRouter);
v1Router.use("/seasons", seasonsRouter);
v1Router.use("/leagues", leaguesRouter);
v1Router.use("/now", nowRouter);

v1Router.use("/allstar", allstarRouter);
v1Router.use("/stages", stageRouter);
v1Router.use("/elo", eloRouter);
v1Router.use("/standings", standingsRouter);
v1Router.use("/hall-of-fame", hallOfFameRouter);
v1Router.use("/season-results", seasonResultsRouter);

v1Router.get("/stats", async (req, res) => {
  const stats = await landingPageStatistics();
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.status(200).json(stats);
});

v1Router.get("/health/discord", async (req, res) => {
  const healthStatus = await checkDiscordHealth();

  if (!healthStatus.configured) {
    res.status(200).json({
      status: "not_configured",
      service: "discord",
      message: "Discord is not configured (environment variables not set)"
    });
  } else if (healthStatus.healthy) {
    res.status(200).json({
      status: "healthy",
      service: "discord",
      message: "Discord client is connected and ready"
    });
  } else {
    res.status(503).json({
      status: "unhealthy",
      service: "discord",
      message: "Discord client is not connected or not ready"
    });
  }
});

v1Router.get("/health/rabbitmq", async (req, res) => {
  const healthStatus = await queueConsumerManager.checkHealth();

  if (!healthStatus.configured) {
    res.status(200).json({
      status: "not_configured",
      service: "rabbitmq",
      message: "RabbitMQ is not configured (environment variables not set)"
    });
  } else if (healthStatus.healthy) {
    res.status(200).json({
      status: "healthy",
      service: "rabbitmq",
      message: "RabbitMQ consumers are connected and healthy",
      consumerCount: healthStatus.consumerCount
    });
  } else {
    res.status(503).json({
      status: "unhealthy",
      service: "rabbitmq",
      message: "RabbitMQ consumers are not connected or unhealthy",
      consumerCount: healthStatus.consumerCount
    });
  }
});

v1Router.get("/health/database", async (req, res) => {
  try {
    const poolStats = getPoolStats();
    const isHealthy =
      poolStats.utilizationPercent < 95 && poolStats.queued === 0;

    if (isHealthy) {
      res.status(200).json({
        status: "healthy",
        service: "database",
        message: "Database connection pool is healthy",
        pool: poolStats
      });
    } else {
      res.status(503).json({
        status: "unhealthy",
        service: "database",
        message: "Database connection pool is under high load",
        pool: poolStats
      });
    }
  } catch (error) {
    res.status(503).json({
      status: "error",
      service: "database",
      message: "Failed to check database pool health",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// General health check endpoint (must be after specific health routes)
v1Router.get("/health", async (req, res) => {
  res.status(200).json({ message: "API is running" });
});

export default v1Router;
