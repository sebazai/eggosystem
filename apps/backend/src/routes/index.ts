import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth.middleware";
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
import gameRouter from "./v1/game.routes";
import sortterRouter from "./v1/sortter.routes";
import { verifyEmailController } from "../controllers/account.controllers";
import { landingPageStatistics } from "../services/landing-page.services";
import parseQueryFilterParams from "../middlewares/parse-query-filter-params.middleware";
import { cacheResponseMiddleware } from "../middlewares/cache-filtered-queries";

// Create a new Router instance
const v1Router = Router();

// Dashboard
v1Router.use("/dashboard", authenticateJWT, dashboardRouter);

// Mount the routers
v1Router.use("/auth", authRouter);
v1Router.use("/players", playerRouter);
v1Router.use("/matches", matchRouter);
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
v1Router.use("/registrations", registrationsRouter);
v1Router.use("/leagues", leaguesRouter);
v1Router.use("/now", nowRouter);
v1Router.use("/sortter", sortterRouter);
v1Router.use("/accounts", authenticateJWT, accountRouter);
v1Router.use("/faceit", faceitRouter);
v1Router.use("/allstar", allstarRouter);

v1Router.get("/stats", async (req, res) => {
  const stats = await landingPageStatistics();
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.status(200).json(stats);
});
v1Router.post("/verify-email", verifyEmailController);

v1Router.use("/", async (req, res) => {
  res.status(200).json({ message: "API is running" });
});
export default v1Router;
