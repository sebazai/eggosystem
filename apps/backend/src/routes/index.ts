import { Router } from "express";
import homeRouter from "./v1/home.routes";
import playerRouter from "./v1/player.routes";
import matchRouter from "./v1/match.routes";
import leaderboardRouter from "./v1/leaderboard.routes";
import organizationRouter from "./v1/organization.routes";
import mapsRouter from "./v1/map.routes";
import filtersRouter from "./v1/filter.routes";

// Create a new Router instance
const v1Router = Router();

// Mount the routers
v1Router.use("/", homeRouter);
v1Router.use("/players", playerRouter);
v1Router.use("/matches", matchRouter);
v1Router.use("/leaderboards", leaderboardRouter);
v1Router.use("/organizations", organizationRouter);
v1Router.use("/maps", mapsRouter);
v1Router.use("/filters", filtersRouter);

export default v1Router;
