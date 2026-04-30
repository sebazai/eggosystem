/**
 * Resolver for round-robin BO2-as-2xBO1 FaceIT rooms.
 *
 * Background: a round-robin BO2 league represented as 2xBO1 has TWO sibling
 * rows in our `Matches` table sharing the same `external_match_room_id`.
 * FaceIT only sends ONE `match_status_finished` webhook per room (or per
 * restart), so historically the controller used a webhook-ordinal index
 * (`getMatchStatusFinishedCountAfterLastConfiguring`) to pick which sibling
 * to mark terminal. That index is unreliable — particularly for forfeit
 * paths — and leaves one sibling stuck in SCHEDULED.
 *
 * This module replaces that ordinal-indexing strategy with a pure resolver
 * that derives terminal-state writes from sibling DB state + payload type +
 * MatchGame demo presence. The persistence wrapper applies the decisions in
 * a single transaction with an in-transaction status re-check (idempotent).
 */
import type {
  Match,
  MatchStatusFinishedWebhook,
  MatchStatusFinishedAfterAbortWebhook,
  ChampionshipDetailsObjectCreated
} from "@eggosystem/types";
import type { PoolConnection } from "mysql2/promise";
import {
  updateMatchEndTimestamp,
  updateMatchStartAndEndTimestamp,
  updateMatchStatusByMatchId,
  getMatchesByExternalId
} from "../models/match.models";
import { getMatchPickedMapsOrderedByVetoOrder } from "../models/match-team-map-veto.models";
import { logger } from "../utils/app-logger";

/** Matches.status values that mean "do not write again". */
const TERMINAL_STATUSES: ReadonlyArray<Match["status"]> = [
  "FINISHED",
  "FORFEIT",
  "CANCELLED",
  "ABORTED"
];

const isTerminal = (status: Match["status"]): boolean =>
  TERMINAL_STATUSES.includes(status);

export interface RoundRobinBo2SplitDecision {
  match_id: number;
  /**
   * Target terminal status to write for this sibling row. Only `FINISHED` or
   * `FORFEIT` are emitted; the resolver never decides `CANCELLED`/`ABORTED`.
   */
  target_status: "FINISHED" | "FORFEIT";
  /** ISO 8601 UTC string. `null` when only the end timestamp should be written. */
  start_timestamp: string | null;
  /** ISO 8601 UTC string. `null` when no end timestamp is known. */
  end_timestamp: string | null;
  /** Human-readable reason (for logs / debugging). */
  reason: string;
}

export interface SiblingDemoState {
  matchId: number;
  hasDemo: boolean;
}

export interface ResolveRoundRobinBo2SplitFromFaceitParams {
  externalMatchRoomId: string;
  /** Length 2, ordered by id ASC = slot order (slot 0 = first map, slot 1 = second). */
  matchesByRoom: Match[];
  webhookPayload:
    | MatchStatusFinishedWebhook["payload"]
    | MatchStatusFinishedAfterAbortWebhook["payload"];
  isForfeitWebhook: boolean;
  /**
   * Pre-fetched FaceIT match details from the caller. Resolver MUST NOT call
   * `getFaceITMatchDetails` again — caller has already paid that cost.
   */
  faceitMatchDetails: ChampionshipDetailsObjectCreated | unknown;
  /**
   * Demo presence for both siblings (looked up via `hasMatchGameWithDemo`).
   * Order does not matter — the resolver matches by `matchId`.
   */
  siblingDemoState: SiblingDemoState[];
}

/**
 * Look up demo state for a sibling by matchId. Defaults to `false` when the
 * caller did not supply an entry for that sibling (treat as "no demo yet").
 */
const demoFor = (state: SiblingDemoState[], matchId: number): boolean =>
  state.find((s) => s.matchId === matchId)?.hasDemo === true;

/**
 * Cross-check id-ASC slot order against MatchTeamMapVetoes.veto_order. Logs a
 * structured warning when the orders disagree but does not throw — id-ASC
 * remains the slot order of record (it is the order rows were inserted by
 * `addMatchToDatabase`).
 */
const warnIfVetoOrderDiverges = async (
  externalMatchRoomId: string,
  matchesByRoom: Match[]
): Promise<void> => {
  const [first, second] = matchesByRoom;
  if (!first || !second) {
    return;
  }
  type Vetoes = Awaited<
    ReturnType<typeof getMatchPickedMapsOrderedByVetoOrder>
  >;
  const safeLookup = async (matchId: number): Promise<Vetoes | null> => {
    return Promise.resolve()
      .then(() => getMatchPickedMapsOrderedByVetoOrder(matchId))
      .then((rows) => (Array.isArray(rows) ? rows : null))
      .catch((error: unknown) => {
        logger.warn(
          `[2xBO1 resolver] Failed to read veto order for cross-check (room=${externalMatchRoomId}, match_id=${matchId}): ${String(
            error
          )}`
        );
        return null;
      });
  };
  const firstVetoes = await safeLookup(first.id);
  const secondVetoes = await safeLookup(second.id);
  if (firstVetoes === null || secondVetoes === null) {
    return;
  }

  const firstMin = firstVetoes
    .map((v) => v.veto_order)
    .reduce<
      number | null
    >((acc, v) => (acc === null || v < acc ? v : acc), null);
  const secondMin = secondVetoes
    .map((v) => v.veto_order)
    .reduce<
      number | null
    >((acc, v) => (acc === null || v < acc ? v : acc), null);

  if (firstMin === null || secondMin === null) {
    // Vetoes not yet recorded for both siblings — nothing to cross-check.
    return;
  }
  if (firstMin > secondMin) {
    logger.warn(
      `[2xBO1 resolver] id-ASC slot order disagrees with veto_order for room ${externalMatchRoomId}: ` +
        `slot 0 (match_id=${first.id}) min veto_order=${firstMin}, ` +
        `slot 1 (match_id=${second.id}) min veto_order=${secondMin}. Proceeding with id-ASC.`
    );
  }
};

/**
 * Pure resolver: takes sibling DB state + webhook payload + demo presence,
 * returns the list of writes (one per sibling row that still needs a terminal
 * status). Returns `[]` when both siblings are already terminal, or when the
 * input is not a 2-row 2xBO1 split.
 *
 * Slot rules:
 * - `matchesByRoom` is assumed to be ordered by id ASC = slot order.
 *   slot 0 = first map (lower veto_order), slot 1 = second map.
 * - When one sibling is already terminal: the incoming webhook outcome is
 *   assigned to the remaining (non-terminal) sibling, regardless of which
 *   ordinal webhook this is.
 * - When both non-terminal + real finished webhook: both siblings → FINISHED.
 * - When both non-terminal + forfeit webhook:
 *     - The sibling WITHOUT a MatchGame demo is the forfeit candidate.
 *     - If both lack demos, mark the lower-index sibling FORFEIT and leave
 *       the other one for the next webhook.
 *     - If both already have demos, this branch should not have triggered a
 *       forfeit — fall through and treat as a real-finished outcome to be
 *       safe (both → FINISHED).
 */
export const resolveRoundRobinBo2SplitFromFaceit = (
  params: ResolveRoundRobinBo2SplitFromFaceitParams
): RoundRobinBo2SplitDecision[] => {
  const {
    externalMatchRoomId,
    matchesByRoom,
    webhookPayload,
    isForfeitWebhook,
    siblingDemoState
  } = params;

  if (matchesByRoom.length !== 2) {
    logger.warn(
      `[2xBO1 resolver] Expected exactly 2 sibling Matches rows, got ${matchesByRoom.length} for room ${externalMatchRoomId}. Skipping.`
    );
    return [];
  }

  const [slot0, slot1] = matchesByRoom;
  if (!slot0 || !slot1) {
    return [];
  }

  // Short-circuit: nothing to do if both rows are already terminal.
  // This path is "undocumented" in the sense that FaceIT should not normally
  // emit another `match_status_finished` webhook after both siblings have been
  // resolved to terminal — but a webhook retry, manual reprocess, or a rare
  // FaceIT redelivery can land here. Emit a structured warning so we can
  // observe and audit such occurrences (S2-AC-3) without mutating any rows.
  if (isTerminal(slot0.status) && isTerminal(slot1.status)) {
    logger.warn(
      `[2xBO1 resolver] Both siblings already terminal for room ${externalMatchRoomId} ` +
        `(slot 0 match_id=${slot0.id} status=${slot0.status}, ` +
        `slot 1 match_id=${slot1.id} status=${slot1.status}). ` +
        `Webhook=${isForfeitWebhook ? "forfeit" : "finished"} — no rows mutated. ` +
        `This usually indicates a retried/replayed webhook delivery.`
    );
    return [];
  }

  // started_at is "1970-01-01T00:00:00Z" for forfeit payloads — only useful as
  // a real start timestamp on real finished webhooks.
  const startedAt = isForfeitWebhook
    ? null
    : (webhookPayload.started_at ?? null);
  const finishedAt = webhookPayload.finished_at ?? null;

  // Case A: exactly one sibling already terminal → assign incoming outcome to
  // the remaining sibling.
  if (isTerminal(slot0.status) !== isTerminal(slot1.status)) {
    const remaining = isTerminal(slot0.status) ? slot1 : slot0;
    const target: RoundRobinBo2SplitDecision["target_status"] = isForfeitWebhook
      ? "FORFEIT"
      : "FINISHED";
    return [
      {
        match_id: remaining.id,
        target_status: target,
        // Forfeit payloads have epoch started_at — never overwrite a real
        // start timestamp the demo-ready path may have set.
        start_timestamp: isForfeitWebhook ? null : startedAt,
        end_timestamp: finishedAt,
        reason: `One sibling (match_id=${
          isTerminal(slot0.status) ? slot0.id : slot1.id
        }) already terminal (${
          isTerminal(slot0.status) ? slot0.status : slot1.status
        }); assigning ${target} to remaining sibling (match_id=${remaining.id}).`
      }
    ];
  }

  // Case B: both siblings non-terminal + real finished webhook → both FINISHED.
  if (!isForfeitWebhook) {
    return [
      {
        match_id: slot0.id,
        target_status: "FINISHED",
        start_timestamp: startedAt,
        end_timestamp: finishedAt,
        reason: `Both siblings non-terminal; real finished webhook → mark slot 0 (match_id=${slot0.id}) FINISHED.`
      },
      {
        match_id: slot1.id,
        target_status: "FINISHED",
        start_timestamp: startedAt,
        end_timestamp: finishedAt,
        reason: `Both siblings non-terminal; real finished webhook → mark slot 1 (match_id=${slot1.id}) FINISHED.`
      }
    ];
  }

  // Case C: both siblings non-terminal + forfeit webhook.
  const slot0HasDemo = demoFor(siblingDemoState, slot0.id);
  const slot1HasDemo = demoFor(siblingDemoState, slot1.id);

  if (slot0HasDemo && slot1HasDemo) {
    // Both played — defensive fallback; should not normally happen on a
    // forfeit webhook, but treat as both FINISHED rather than over-forfeiting.
    logger.warn(
      `[2xBO1 resolver] Forfeit webhook for room ${externalMatchRoomId} but both siblings already have demos — treating as FINISHED.`
    );
    return [
      {
        match_id: slot0.id,
        target_status: "FINISHED",
        start_timestamp: null,
        end_timestamp: finishedAt,
        reason: `Forfeit webhook arrived but slot 0 already has a demo — coercing to FINISHED.`
      },
      {
        match_id: slot1.id,
        target_status: "FINISHED",
        start_timestamp: null,
        end_timestamp: finishedAt,
        reason: `Forfeit webhook arrived but slot 1 already has a demo — coercing to FINISHED.`
      }
    ];
  }

  if (slot0HasDemo && !slot1HasDemo) {
    return [
      {
        match_id: slot1.id,
        target_status: "FORFEIT",
        start_timestamp: null,
        end_timestamp: finishedAt,
        reason: `Forfeit webhook; slot 0 has demo, slot 1 does not → slot 1 (match_id=${slot1.id}) FORFEIT.`
      }
    ];
  }
  if (!slot0HasDemo && slot1HasDemo) {
    return [
      {
        match_id: slot0.id,
        target_status: "FORFEIT",
        start_timestamp: null,
        end_timestamp: finishedAt,
        reason: `Forfeit webhook; slot 1 has demo, slot 0 does not → slot 0 (match_id=${slot0.id}) FORFEIT.`
      }
    ];
  }

  // Both lack demos → mark lower-index sibling FORFEIT, leave the other for
  // the next webhook to resolve (it will fall into Case A when that webhook
  // arrives).
  return [
    {
      match_id: slot0.id,
      target_status: "FORFEIT",
      start_timestamp: null,
      end_timestamp: finishedAt,
      reason: `Forfeit webhook; neither sibling has a demo → mark lower-index slot 0 (match_id=${slot0.id}) FORFEIT, leave slot 1 for next webhook.`
    }
  ];
};

/**
 * Wrapper around `resolveRoundRobinBo2SplitFromFaceit` that also runs the
 * id-ASC vs veto_order cross-check. Kept separate so the pure function
 * remains synchronous and easy to unit-test.
 */
export const resolveRoundRobinBo2SplitFromFaceitWithVetoCheck = async (
  params: ResolveRoundRobinBo2SplitFromFaceitParams
): Promise<RoundRobinBo2SplitDecision[]> => {
  await warnIfVetoOrderDiverges(
    params.externalMatchRoomId,
    params.matchesByRoom
  );
  return resolveRoundRobinBo2SplitFromFaceit(params);
};

/**
 * Persistence wrapper: write each decision inside a single PoolConnection
 * transaction. Re-checks status inside the transaction before writing so a
 * concurrent write (e.g. match_demo_ready landing the FINISHED status while
 * we were resolving) does not get overwritten — idempotent.
 *
 * `externalMatchRoomId` is used to re-read sibling status via the existing
 * `getMatchesByExternalId` model — keeps this function within the project's
 * model-layered DB access (and easily mockable in tests).
 */
export const applyRoundRobinBo2SplitDecisions = async (
  decisions: RoundRobinBo2SplitDecision[],
  connection: PoolConnection,
  externalMatchRoomId: string
): Promise<void> => {
  if (decisions.length === 0) {
    return;
  }

  // Re-read current sibling state inside the transaction so a write landed by
  // a concurrent webhook (e.g. `match_demo_ready` flipping the row to
  // FINISHED) is honoured.
  const currentRows = await getMatchesByExternalId(
    externalMatchRoomId,
    connection
  );
  const currentStatusByMatchId = new Map<number, Match["status"]>();
  for (const row of currentRows) {
    currentStatusByMatchId.set(row.id, row.status);
  }

  for (const decision of decisions) {
    const currentStatus = currentStatusByMatchId.get(decision.match_id);
    if (currentStatus === undefined) {
      logger.warn(
        `[2xBO1 resolver] Decision targets match_id=${decision.match_id} but row not found in transaction snapshot — skipping. Reason: ${decision.reason}`
      );
      continue;
    }
    if (isTerminal(currentStatus)) {
      logger.info(
        `[2xBO1 resolver] Skipping match_id=${decision.match_id}: already terminal (${currentStatus}). Decision was: ${decision.target_status} (${decision.reason})`
      );
      continue;
    }

    if (decision.start_timestamp !== null && decision.end_timestamp !== null) {
      await updateMatchStartAndEndTimestamp(
        decision.match_id,
        decision.start_timestamp,
        decision.end_timestamp,
        connection
      );
    } else if (decision.end_timestamp !== null) {
      await updateMatchEndTimestamp(
        decision.match_id,
        decision.end_timestamp,
        connection
      );
    }

    await updateMatchStatusByMatchId(
      decision.match_id,
      decision.target_status,
      connection
    );

    logger.info(
      `[2xBO1 resolver] Wrote match_id=${decision.match_id} → ${decision.target_status}. ${decision.reason}`
    );
  }
};
