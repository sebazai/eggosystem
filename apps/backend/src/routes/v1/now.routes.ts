import { Router, type Request, type Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const time = new Date().getTime();
  res.status(200).send({ now: time });
});

export default router;
