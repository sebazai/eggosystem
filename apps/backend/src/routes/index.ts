import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth.middleware";
import authRouter from "./v1/auth.routes";
import playerRouter from "./v1/player.routes";
import matchRouter from "./v1/match.routes";
import leaderboardRouter from "./v1/leaderboard.routes";
import organizationRouter from "./v1/organization.routes";
import mapsRouter from "./v1/map.routes";
import filtersRouter from "./v1/filter.routes";
import teamsRouter from "./v1/team.routes";
import seasonsRouter from "./v1/season.routes";
import leaguesRouter from "./v1/league.routes";
import topteamsRouter from "./v1/topteams.routes";
import nowRouter from "./v1/now.routes";
import profileRouter from "./v1/profile.routes";

// Create a new Router instance
const v1Router = Router();

// Mount the routers
v1Router.use("/auth", authRouter);
v1Router.use("/players", authenticateJWT, playerRouter);
v1Router.use("/matches", matchRouter);
v1Router.use("/leaderboards", leaderboardRouter);
v1Router.use("/organizations", organizationRouter);
v1Router.use("/filters", filtersRouter);
v1Router.use("/maps", mapsRouter);
v1Router.use("/teams", teamsRouter);
v1Router.use("/seasons", seasonsRouter);
v1Router.use("/leagues", leaguesRouter);
v1Router.use("/topteams", topteamsRouter);
v1Router.use("/now", nowRouter);
v1Router.use("/profiles", authenticateJWT, profileRouter);
v1Router.use("/", async () => {
  console.log("Hello");
});
export default v1Router;
