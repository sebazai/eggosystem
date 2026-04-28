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

/**
 * Resolve a FACEIT-reported veto action to the canonical internal action
 * using the veto template for the given best-of format.
 *
 * FACEIT only reports `"drop"` | `"pick"` — this function reclassifies the
 * final step as `"decider"` when the template says so (or falls back to
 * position-based heuristics for unknown best-of values).
 */
export function resolveVetoAction(
  bestOf: number,
  vetoOrder: number,
  totalSteps: number,
  faceitAction: "drop" | "pick"
): VetoAction {
  const template = VETO_TEMPLATE_MAP.get(bestOf);

  if (template) {
    const step = template.steps.find((s) => s.order === vetoOrder);
    if (step) return step.action;
  }

  // Fallback for unregistered best-of values:
  // last step + pick → decider
  if (vetoOrder === totalSteps && faceitAction === "pick") {
    return "decider";
  }

  return faceitAction;
}

/**
 * Team that must act at this veto step under alternating BO1/BO3/BO5 rules
 * (A-ban, B-ban, …): odd `vetoOrder` (1-based) uses `voteStarterTeamId`, even uses the other match team.
 *
 * `orderedMatchTeamIds` must be the two participant team ids in **ascending `team_id` order**
 * (same order as `MatchTeams` for a two-team match).
 *
 * @returns `null` when `voteStarterTeamId` is not one of the two teams.
 */
export function getExpectedVetoActingTeamId(
  vetoOrder: number,
  voteStarterTeamId: number,
  orderedMatchTeamIds: readonly [number, number]
): number | null {
  const [teamLow, teamHigh] = orderedMatchTeamIds;
  if (voteStarterTeamId !== teamLow && voteStarterTeamId !== teamHigh) {
    return null;
  }
  const otherTeamId = voteStarterTeamId === teamLow ? teamHigh : teamLow;
  return vetoOrder % 2 === 1 ? voteStarterTeamId : otherTeamId;
}
