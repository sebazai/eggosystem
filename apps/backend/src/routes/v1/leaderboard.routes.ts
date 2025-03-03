import { Router } from "express";

import parseQueryParams from "../../middlewares/parseQueryParams";
import { filterPath } from "./filters";

const router = Router();

// Filterpath should be deprecated...
router.get(`${filterPath}/kana-rating`, parseQueryParams, () => {});
router.get(`${filterPath}/average-kast`, parseQueryParams, () => {});
router.get(`${filterPath}/fk-per-match`, parseQueryParams, () => {});
router.get(`${filterPath}/fk-duel-won-pct`, parseQueryParams, () => {});
router.get(`${filterPath}/headshot-pct`, parseQueryParams, () => {});
router.get(`${filterPath}/kd-difference`, parseQueryParams, () => {});
router.get(`${filterPath}/enemies-flashed-pct`, parseQueryParams, () => {});
router.get(`${filterPath}/total-assists`, parseQueryParams, () => {});
router.get(`${filterPath}/total-flash-assists`, parseQueryParams, () => {});
router.get(`${filterPath}/total-kills`, parseQueryParams, () => {});
router.get(`${filterPath}/total-utility-dmg`, parseQueryParams, () => {});
router.get(`${filterPath}/total-dmg`, parseQueryParams, () => {});
router.get(`${filterPath}/total-awp-kills`, parseQueryParams, () => {});
router.get(`${filterPath}/total-hs`, parseQueryParams, () => {});
router.get(`${filterPath}/total-enemies-flashed`, parseQueryParams, () => {});
router.get(`${filterPath}/total-mates-flashed`, parseQueryParams, () => {});
router.get(`${filterPath}/total-clutches-won`, parseQueryParams, () => {});
router.get(`${filterPath}/total-duels-won`, parseQueryParams, () => {});
router.get(`${filterPath}/flashed-self`, parseQueryParams, () => {});
router.get(`${filterPath}/most-first-deaths`, parseQueryParams, () => {});
router.get(`${filterPath}/flashed-thrown`, parseQueryParams, () => {});
router.get(`${filterPath}/most-first-kills`, parseQueryParams, () => {});
router.get(`${filterPath}/total-enemy-flash-dur`, parseQueryParams, () => {});
router.get(`${filterPath}/kills-per-round`, parseQueryParams, () => {});
router.get(`${filterPath}/awp-kills-per-round`, parseQueryParams, () => {});
router.get(`${filterPath}/assists-per-round`, parseQueryParams, () => {});
router.get(`${filterPath}/avg-dmg-per-round`, parseQueryParams, () => {});
router.get(`${filterPath}/utility-dmg-per-round`, parseQueryParams, () => {});
router.get(`${filterPath}/hs-per-round`, parseQueryParams, () => {});
router.get(`${filterPath}/best-support-rate`, parseQueryParams, () => {});

export default router;
