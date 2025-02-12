import { Router } from "express";

import parseParams from "../../middlewares/parseParams";
import { filterPath } from "./filters";

const router = Router();

router.get(`${filterPath}/kana-rating`, parseParams, () => {});
router.get(`${filterPath}/average-kast`, parseParams, () => {});
router.get(`${filterPath}/fk-per-match`, parseParams, () => {});
router.get(`${filterPath}/fk-duel-won-pct`, parseParams, () => {});
router.get(`${filterPath}/headshot-pct`, parseParams, () => {});
router.get(`${filterPath}/kd-difference`, parseParams, () => {});
router.get(`${filterPath}/enemies-flashed-pct`, parseParams, () => {});
router.get(`${filterPath}/total-assists`, parseParams, () => {});
router.get(`${filterPath}/total-flash-assists`, parseParams, () => {});
router.get(`${filterPath}/total-kills`, parseParams, () => {});
router.get(`${filterPath}/total-utility-dmg`, parseParams, () => {});
router.get(`${filterPath}/total-dmg`, parseParams, () => {});
router.get(`${filterPath}/total-awp-kills`, parseParams, () => {});
router.get(`${filterPath}/total-hs`, parseParams, () => {});
router.get(`${filterPath}/total-enemies-flashed`, parseParams, () => {});
router.get(`${filterPath}/total-mates-flashed`, parseParams, () => {});
router.get(`${filterPath}/total-clutches-won`, parseParams, () => {});
router.get(`${filterPath}/total-duels-won`, parseParams, () => {});
router.get(`${filterPath}/flashed-self`, parseParams, () => {});
router.get(`${filterPath}/most-first-deaths`, parseParams, () => {});
router.get(`${filterPath}/flashed-thrown`, parseParams, () => {});
router.get(`${filterPath}/most-first-kills`, parseParams, () => {});
router.get(`${filterPath}/total-enemy-flash-dur`, parseParams, () => {});
router.get(`${filterPath}/kills-per-round`, parseParams, () => {});
router.get(`${filterPath}/awp-kills-per-round`, parseParams, () => {});
router.get(`${filterPath}/assists-per-round`, parseParams, () => {});
router.get(`${filterPath}/avg-dmg-per-round`, parseParams, () => {});
router.get(`${filterPath}/utility-dmg-per-round`, parseParams, () => {});
router.get(`${filterPath}/hs-per-round`, parseParams, () => {});
router.get(`${filterPath}/best-support-rate`, parseParams, () => {});

export default router;
