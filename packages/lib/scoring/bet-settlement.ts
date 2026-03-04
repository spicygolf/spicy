/**
 * Bet Settlement Bridge
 *
 * Converts game bets + scoreboard data into settlement engine inputs
 * and runs the payout calculation. Bridges the Bet schema (scope, scoringType)
 * to the settlement engine's PoolConfig + PlayerMetrics model.
 *
 * Two settlement models:
 * - Pool-funded (Big Game): buy_in → pot → pools split by pct
 * - Stakes (Nassau/Closeout/Florida Bet): each bet has a fixed amount,
 *   loser pays winner directly
 */

import { calculateQuotaPerformances, extractSkinCounts } from "./quota-metrics";
import type {
  Payout,
  PlayerMetrics,
  PoolConfig,
  SettlementResult,
} from "./settlement-engine";
import {
  calculatePoolPayouts,
  calculateSettlement,
  reconcileDebts,
} from "./settlement-engine";
import type { PlayerQuota, Scoreboard } from "./types";

// =============================================================================
// Types
// =============================================================================

/** Plain-data representation of a Bet (no Jazz dependency). */
export interface BetConfig {
  name: string;
  disp: string;
  scope: "front9" | "back9" | "all18";
  scoringType: "quota" | "skins" | "points" | "match";
  /** Percentage of total pot (pool-funded games). */
  pct?: number;
  /** Fixed dollar amount per bet (stakes games). */
  amount?: number;
  splitType: "places" | "per_unit" | "winner_take_all";
  placesPaid?: number;
  payoutPcts?: number[];
}

/** Input for the settleBets bridge function. */
export interface SettleBetsInput {
  bets: BetConfig[];
  players: Array<{ id: string; name: string }>;
  scoreboard: Scoreboard;
  playerQuotas?: Map<string, PlayerQuota>;
  buyIn: number;
  defaultPlacesPaid?: number;
}

// =============================================================================
// Metric Key Mapping
// =============================================================================

const SCOPE_METRIC_SUFFIX: Record<string, string> = {
  front9: "front",
  back9: "back",
  all18: "overall",
};

/**
 * Build a metric key from scoring type and scope.
 *
 * @example
 * getMetricKey("quota", "front9") // "quota_front"
 * getMetricKey("skins", "all18")  // "skins_won"
 */
function getMetricKey(scoringType: string, scope: string): string {
  if (scoringType === "skins") {
    return "skins_won";
  }
  const suffix = SCOPE_METRIC_SUFFIX[scope] ?? "overall";
  return `${scoringType}_${suffix}`;
}

// =============================================================================
// Bridge Functions
// =============================================================================

/**
 * Convert a BetConfig to a settlement engine PoolConfig.
 *
 * @param bet - The bet to convert
 * @param defaultPlacesPaid - Fallback placesPaid from game options (used when bet doesn't specify)
 * @returns A PoolConfig suitable for the settlement engine
 */
export function betToPoolConfig(
  bet: BetConfig,
  defaultPlacesPaid?: number,
): PoolConfig {
  return {
    name: bet.name,
    disp: bet.disp,
    pct: bet.pct ?? 0,
    metric: getMetricKey(bet.scoringType, bet.scope),
    splitType: bet.splitType,
    placesPaid:
      bet.splitType === "places"
        ? (bet.placesPaid ?? defaultPlacesPaid)
        : undefined,
    payoutPcts: bet.payoutPcts,
  };
}

/**
 * Extract PlayerMetrics from a scoreboard based on the scoring types used by the bets.
 *
 * Runs the appropriate metric extractors (quota performance, skin counts)
 * and combines them into a unified PlayerMetrics array.
 *
 * @param bets - The bets that determine which metrics to extract
 * @param scoreboard - Scored scoreboard from the pipeline
 * @param playerQuotas - Player quotas (required for quota bets)
 * @param players - Player id/name pairs
 * @returns PlayerMetrics array with all needed metrics populated
 */
export function extractMetricsForBets(
  bets: BetConfig[],
  scoreboard: Scoreboard,
  playerQuotas: Map<string, PlayerQuota> | undefined,
  players: Array<{ id: string; name: string }>,
): PlayerMetrics[] {
  const scoringTypes = new Set(bets.map((b) => b.scoringType));

  // Extract quota performances if any bet uses quota scoring
  let quotaByPlayer:
    | Map<string, { front: number; back: number; total: number }>
    | undefined;
  if (scoringTypes.has("quota") && playerQuotas) {
    const performances = calculateQuotaPerformances(scoreboard, playerQuotas);
    quotaByPlayer = new Map(
      performances.map((p) => [p.playerId, p.performance]),
    );
  }

  // Extract skin counts if any bet uses skins scoring
  let skinsByPlayer: Map<string, number> | undefined;
  if (scoringTypes.has("skins")) {
    skinsByPlayer = extractSkinCounts(scoreboard);
  }

  // Build PlayerMetrics for each player
  return players.map((player) => {
    const metrics: Record<string, number> = {};

    if (quotaByPlayer) {
      const perf = quotaByPlayer.get(player.id);
      metrics.quota_front = perf?.front ?? 0;
      metrics.quota_back = perf?.back ?? 0;
      metrics.quota_overall = perf?.total ?? 0;
    }

    if (skinsByPlayer) {
      metrics.skins_won = skinsByPlayer.get(player.id) ?? 0;
    }

    return {
      playerId: player.id,
      playerName: player.name,
      metrics,
    };
  });
}

// =============================================================================
// Settlement Paths
// =============================================================================

/**
 * Determine settlement model from bet configs.
 * Stakes if any bet has `amount`; pool-funded otherwise.
 */
function isStakesGame(bets: BetConfig[]): boolean {
  return bets.some((b) => b.amount !== undefined && b.amount > 0);
}

/**
 * Settle stakes-based bets (Nassau, Closeout, Florida Bet).
 *
 * Each bet has a fixed `amount`. Every player puts in that amount per bet,
 * and the winner(s) take the pool for that bet. Uses the same payout split
 * logic as pool-funded games but with absolute dollar amounts per bet.
 *
 * Total buy-in per player = sum of all bet amounts.
 */
function settleStakesBets(input: SettleBetsInput): SettlementResult {
  const { bets, players, scoreboard, playerQuotas, defaultPlacesPaid } = input;

  const playerMetrics = extractMetricsForBets(
    bets,
    scoreboard,
    playerQuotas,
    players,
  );

  const allPayouts: Payout[] = [];
  let totalBuyIn = 0;

  for (const bet of bets) {
    const betAmount = bet.amount ?? 0;
    const poolTotal = betAmount * players.length;
    totalBuyIn += betAmount;

    const pool: PoolConfig = {
      name: bet.name,
      disp: bet.disp,
      pct: 0, // Not used — poolAmount is the absolute betAmount × playerCount
      metric: getMetricKey(bet.scoringType, bet.scope),
      splitType: bet.splitType,
      placesPaid: bet.placesPaid ?? defaultPlacesPaid,
      payoutPcts: bet.payoutPcts,
    };

    const poolPayouts = calculatePoolPayouts(pool, playerMetrics, poolTotal);
    allPayouts.push(...poolPayouts);
  }

  const potTotal = totalBuyIn * players.length;

  // Net positions: start at -totalBuyIn (sum of all bet amounts), add winnings
  const netPositions: Record<string, number> = {};
  for (const pm of playerMetrics) {
    netPositions[pm.playerId] = -totalBuyIn;
  }
  for (const payout of allPayouts) {
    netPositions[payout.playerId] =
      (netPositions[payout.playerId] ?? -totalBuyIn) + payout.amount;
  }
  // Round to avoid floating point issues
  for (const playerId of Object.keys(netPositions)) {
    const value = netPositions[playerId];
    if (value !== undefined) {
      netPositions[playerId] = Math.round(value * 100) / 100;
    }
  }

  // Build player name lookup and reconcile debts
  const playerNames: Record<string, string> = {};
  for (const pm of playerMetrics) {
    playerNames[pm.playerId] = pm.playerName;
  }
  const debts = reconcileDebts(netPositions, playerNames);

  return {
    potTotal,
    buyIn: totalBuyIn,
    payouts: allPayouts,
    netPositions,
    debts,
  };
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Settle bets for a game.
 *
 * Routes to the appropriate settlement model:
 * - Pool-funded (bets have `pct`): buy_in → pot → pools split by pct
 * - Stakes (bets have `amount`): each bet is an independent fixed-amount pool
 */
export function settleBets(input: SettleBetsInput): SettlementResult {
  const { bets, players, scoreboard, playerQuotas, buyIn, defaultPlacesPaid } =
    input;

  if (isStakesGame(bets)) {
    const hasPoolBets = bets.some((b) => (b.pct ?? 0) > 0);
    if (hasPoolBets) {
      throw new Error(
        "Mixed bet models are not supported: use either amount-based or pct-based bets.",
      );
    }
    const unsupported = bets
      .filter((b) => b.scoringType === "match" || b.scoringType === "points")
      .map((b) => b.scoringType);
    if (unsupported.length > 0) {
      throw new Error(
        `Unsupported scoring types in stakes settlement: ${[...new Set(unsupported)].join(", ")}`,
      );
    }
    return settleStakesBets(input);
  }

  // Pool-funded path (original)
  const pools = bets.map((bet) => betToPoolConfig(bet, defaultPlacesPaid));
  const playerMetrics = extractMetricsForBets(
    bets,
    scoreboard,
    playerQuotas,
    players,
  );
  const potTotal = buyIn * players.length;

  return calculateSettlement(pools, playerMetrics, potTotal);
}
