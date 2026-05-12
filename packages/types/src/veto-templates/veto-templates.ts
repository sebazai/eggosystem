import type {
  VetoAction,
  VetoTemplate,
  VetoTemplateStep
} from "./VetoTemplate.interface";

const CS2_MAP_POOL_SIZE = 7;

function buildSteps(
  actions: readonly VetoAction[]
): readonly VetoTemplateStep[] {
  return actions.map((action, i) => ({ order: i + 1, action }));
}

/**
 * BO1 — six bans, one decider.
 * A-ban, B-ban, A-ban, B-ban, A-ban, B-ban, decider.
 */
const BO1_TEMPLATE: VetoTemplate = {
  bestOf: 1,
  mapPoolSize: CS2_MAP_POOL_SIZE,
  steps: buildSteps(["drop", "drop", "drop", "drop", "drop", "drop", "decider"])
};

/**
 * BO2 — four bans, two picks, one final ban (no decider).
 * A-ban, B-ban, A-ban, B-ban, A-pick, B-pick, B-ban.
 */
const BO2_TEMPLATE: VetoTemplate = {
  bestOf: 2,
  mapPoolSize: CS2_MAP_POOL_SIZE,
  steps: buildSteps(["drop", "drop", "drop", "drop", "pick", "pick", "drop"])
};

/**
 * BO3 — two bans, two picks, two bans, one decider.
 * A-ban, B-ban, A-pick, B-pick, A-ban, B-ban, decider.
 */
const BO3_TEMPLATE: VetoTemplate = {
  bestOf: 3,
  mapPoolSize: CS2_MAP_POOL_SIZE,
  steps: buildSteps(["drop", "drop", "pick", "pick", "drop", "drop", "decider"])
};

/**
 * BO5 — two bans, four picks, one decider.
 * A-ban, B-ban, A-pick, B-pick, A-pick, B-pick, decider.
 */
const BO5_TEMPLATE: VetoTemplate = {
  bestOf: 5,
  mapPoolSize: CS2_MAP_POOL_SIZE,
  steps: buildSteps(["drop", "drop", "pick", "pick", "pick", "pick", "decider"])
};

const VETO_TEMPLATE_MAP: ReadonlyMap<number, VetoTemplate> = new Map([
  [1, BO1_TEMPLATE],
  [2, BO2_TEMPLATE],
  [3, BO3_TEMPLATE],
  [5, BO5_TEMPLATE]
]);

/**
 * Look up the veto template for a given best-of value.
 * Returns `undefined` when no template is registered.
 */
export function getVetoTemplate(bestOf: number): VetoTemplate | undefined {
  return VETO_TEMPLATE_MAP.get(bestOf);
}

/**
 * Returns every registered veto template keyed by best-of value.
 */
export function getAllVetoTemplates(): ReadonlyMap<number, VetoTemplate> {
  return VETO_TEMPLATE_MAP;
}

const REGISTERED_VETO_BEST_OF = [1, 2, 3, 5] as const;

/**
 * When a season uses `is_round_robin_bo2_as_2xbo1`, round-robin (stage 1) hub matches are
 * stored as BO1 rows but the room map veto follows BO2.
 */
export function getDefaultAdminVetoBestOf(opts: {
  storedBestOf: number;
  stage: number;
  isRoundRobinBo2As2xBo1: boolean;
}): number {
  const { storedBestOf, stage, isRoundRobinBo2As2xBo1 } = opts;
  if (isRoundRobinBo2As2xBo1 && stage === 1 && storedBestOf === 1) return 2;
  return storedBestOf;
}

/**
 * Infer which best-of veto pattern was used from stored veto rows (ordered by `veto_order`).
 */
export function inferVetoBestOfFromOrderedActions(
  actions: readonly VetoAction[]
): number | null {
  for (const bo of REGISTERED_VETO_BEST_OF) {
    const t = getVetoTemplate(bo);
    if (!t || t.steps.length !== actions.length) continue;
    if (t.steps.every((s, i) => actions[i] === s.action)) return bo;
  }
  return null;
}

/**
 * Resolve a FACEIT-reported veto action to the canonical internal action.
 *
 * FACEIT only reports `"drop"` | `"pick"`. Prefer FACEIT for non-final steps so
 * we never contradict per-round status (fixtures and MSW mocks can differ from
 * the canonical 7-map template shape). Promote `"pick"` to `"decider"` only when
 * the full veto history completes the canonical template (`totalSteps === 7`) and
 * the template’s last step is a decider, or when histories are truncated/partials:
 * reuse the legacy best-of modulus rule, unknown best-of, or fallback last-pick→decider.
 */
export function resolveVetoAction(
  bestOf: number,
  vetoOrder: number,
  totalSteps: number,
  faceitAction: "drop" | "pick"
): VetoAction {
  if (faceitAction === "drop") return "drop";

  const template = VETO_TEMPLATE_MAP.get(bestOf);

  if (
    vetoOrder === totalSteps &&
    template &&
    totalSteps === template.steps.length &&
    template.steps.find((s) => s.order === vetoOrder)?.action === "decider"
  ) {
    return "decider";
  }

  if (
    vetoOrder === totalSteps &&
    template !== undefined &&
    totalSteps !== template.steps.length
  ) {
    if (bestOf === 2) return "pick";
    return bestOf % 3 === 0 || bestOf % 5 === 0 ? "decider" : "pick";
  }

  if (vetoOrder === totalSteps && template === undefined) {
    return "decider";
  }

  return "pick";
}

/**
 * Team that must act at this veto step under alternating BO1/BO3/BO5 rules
 * (A-ban, B-ban, …): odd `vetoOrder` (1-based) uses `voteStarterTeamId`, even uses the other match team.
 *
 * For a **`decider`** row, pass `stepAction: "decider"`: that step is credited to whoever acts on
 * `veto_order - 1` (the team that bans last before the remaining map pool is decided), never the naive
 * odd/even seventh turn (BO3/B01/B05: decider belongs to “the other” team versus the opener’s seventh turn).
 *
 * `orderedMatchTeamIds` must be the two participant team ids in **ascending `team_id` order**
 * (same order as `MatchTeams` for a two-team match).
 *
 * @returns `null` when `voteStarterTeamId` is not one of the two teams, or when `stepAction === "decider"` and `vetoOrder <= 1`.
 */
export function getExpectedVetoActingTeamId(
  vetoOrder: number,
  voteStarterTeamId: number,
  orderedMatchTeamIds: readonly [number, number],
  stepAction?: VetoAction
): number | null {
  const [teamLow, teamHigh] = orderedMatchTeamIds;
  if (voteStarterTeamId !== teamLow && voteStarterTeamId !== teamHigh) {
    return null;
  }

  const otherTeamId = voteStarterTeamId === teamLow ? teamHigh : teamLow;

  // Decider resolves from the alternating schedule step immediately before it (same actor as veto_order − 1).
  if (stepAction === "decider") {
    if (vetoOrder <= 1) {
      return null;
    }
    return getExpectedVetoActingTeamId(
      vetoOrder - 1,
      voteStarterTeamId,
      orderedMatchTeamIds
    );
  }

  return vetoOrder % 2 === 1 ? voteStarterTeamId : otherTeamId;
}
