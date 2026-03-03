/**
 * Bet Settlement Bridge
 *
 * Converts game bets + scoreboard data into settlement engine inputs
 * and runs the payout calculation. Bridges the Bet schema (scope, scoringType)
 * to the settlement engine's PoolConfig + PlayerMetrics model.
 *
 * Currently supports pool-funded games (Big Game style: buy_in → pot → pools).
 * Zero-sum games (stakes × differential) will be added in a future phase.
 */

import { calculateQuotaPerformances, extractSkinCounts } from "./quota-metrics";
import type {
  PlayerMetrics,
  PoolConfig,
  SettlementResult,
} from "./settlement-engine";
import { calculateSettlement } from "./settlement-engine";
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
// Public API
// =============================================================================

/**
 * Settle bets for a pool-funded game.
 *
 * Bridges game bets + scoreboard to the settlement engine:
 * 1. Converts each bet to a PoolConfig with the appropriate metric key
 * 2. Extracts player metrics from the scoreboard
 * 3. Runs the full settlement calculation (payouts, net positions, debts)
 *
 * @param input - Bets, players, scoreboard, and game options
 * @returns Full settlement result with payouts, net positions, and reconciled debts
 */
export function settleBets(input: SettleBetsInput): SettlementResult {
  const { bets, players, scoreboard, playerQuotas, buyIn, defaultPlacesPaid } =
    input;

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
