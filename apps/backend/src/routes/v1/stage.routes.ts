import { Router } from "express";
import { getAllStages } from "../../models/stage.models";

const router = Router();

router.get("/", async (req, res) => {
  const stages = await getAllStages();
  res.json(stages);
});

export default router;
