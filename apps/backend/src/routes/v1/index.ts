import { Router } from "express";
import topTeamsRouter from "./topteams.routes";

const router = Router();

router.use("/topteams", topTeamsRouter);

export default router;
