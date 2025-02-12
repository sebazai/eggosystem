import { Router } from "express";
import homeRouter from "./v1/home.routes";
import playerRouter from "./v1/player.routes";
import matchRouter from "./v1/match.routes";
import leaderboardRouter from "./v1/leaderboard.routes";

// Create a new Router instance
const v1Router = Router();

// Mount the routers
v1Router.use("/", homeRouter);
v1Router.use("/players", playerRouter);
v1Router.use("/matches", matchRouter);
v1Router.use("/leaderboards", leaderboardRouter);

export default v1Router;
