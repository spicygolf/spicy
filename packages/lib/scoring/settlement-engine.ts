/**
 * Settlement Engine
 *
 * Calculates multi-pool payouts and reconciles debts.
 * Designed to work with JSON-logic metrics in the future.
 *
 * Example usage:
 *   const metrics = calculateMetrics(game, players);
 *   const payouts = calculatePayouts(pools, metrics, potTotal);
 *   const debts = reconcileDebts(payouts, players.length, potTotal);
 */

// =============================================================================
// Types
// =============================================================================

export interface PoolConfig {
  name: string;
  disp: string;
  pct: number;
  metric: string;
  splitType: "places" | "per_unit" | "winner_take_all";
  placesPaid?: number;
  payoutPcts?: number[];
}

export interface PlayerMetrics {
  playerId: string;
  playerName: string;
  metrics: Record<string, number>;
}

export interface Payout {
  playerId: string;
  playerName: string;
  poolName: string;
  place?: number;
  metricValue: number;
  amount: number;
}

export interface DebtRecord {
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  amount: number;
}

export interface SettlementResult {
  potTotal: number;
  buyIn: number;
  payouts: Payout[];
  netPositions: Record<string, number>;
  debts: DebtRecord[];
}

// =============================================================================
// Default Payout Percentages
// =============================================================================

/**
 * Default payout percentages based on places paid
 * These can be overridden per-pool via payoutPcts
 */
export const DEFAULT_PAYOUT_PCTS: Record<number, number[]> = {
  1: [100],
  2: [60, 40],
  3: [50, 30, 20],
  4: [45, 27, 18, 10],
  5: [40, 25, 17, 11, 7],
};

function getPayoutPcts(placesPaid: number, customPcts?: number[]): number[] {
  if (customPcts && customPcts.length === placesPaid) {
    return customPcts;
  }
  const defaultPcts = DEFAULT_PAYOUT_PCTS[placesPaid];
  if (defaultPcts) return defaultPcts;
  // Fallback to 3 places if not found
  return DEFAULT_PAYOUT_PCTS[3] ?? [50, 30, 20];
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Calculate payouts for a single pool
 */
export function calculatePoolPayouts(
  pool: PoolConfig,
  playerMetrics: PlayerMetrics[],
  poolAmount: number,
): Payout[] {
  const payouts: Payout[] = [];

  // Get metric values for this pool
  const ranked = playerMetrics
    .map((pm) => {
      const metricValue = pm.metrics[pool.metric];
      if (metricValue === undefined) {
        console.warn(
          `Settlement: Metric "${pool.metric}" not found for player ${pm.playerName || pm.playerId}`,
        );
      }
      return {
        playerId: pm.playerId,
        playerName: pm.playerName,
        value: metricValue ?? 0,
      };
    })
    .filter((p) => p.value !== 0 || pool.splitType === "places") // Filter out zeros for per_unit
    .sort((a, b) => b.value - a.value); // Higher is better

  if (ranked.length === 0) {
    return payouts;
  }

  switch (pool.splitType) {
    case "places": {
      const placesPaid = Math.min(pool.placesPaid ?? 3, ranked.length);
      const pcts = getPayoutPcts(placesPaid, pool.payoutPcts);

      // Calculate payouts with remainder tracking to avoid drift
      let totalPaid = 0;
      for (let i = 0; i < placesPaid; i++) {
        const player = ranked[i];
        const pct = pcts[i];
        if (!player || pct === undefined) continue;

        // For last payout, give remainder to avoid rounding drift
        const isLast = i === placesPaid - 1;
        const amount = isLast
          ? poolAmount - totalPaid
          : Math.round((poolAmount * pct) / 100);

        payouts.push({
          playerId: player.playerId,
          playerName: player.playerName,
          poolName: pool.name,
          place: i + 1,
          metricValue: player.value,
          amount,
        });
        totalPaid += amount;
      }
      break;
    }

    case "per_unit": {
      // Split pool equally per unit (e.g., per skin won)
      const totalUnits = ranked.reduce((sum, p) => sum + p.value, 0);
      if (totalUnits === 0) break;

      const amountPerUnit = poolAmount / totalUnits;

      // Calculate payouts with remainder tracking
      let totalPaid = 0;
      const eligiblePlayers = ranked.filter((p) => p && p.value > 0);
      for (let i = 0; i < eligiblePlayers.length; i++) {
        const player = eligiblePlayers[i];
        if (!player) continue;

        // For last payout, give remainder to avoid rounding drift
        const isLast = i === eligiblePlayers.length - 1;
        const amount = isLast
          ? poolAmount - totalPaid
          : Math.round(player.value * amountPerUnit);

        payouts.push({
          playerId: player.playerId,
          playerName: player.playerName,
          poolName: pool.name,
          metricValue: player.value,
          amount,
        });
        totalPaid += amount;
      }
      break;
    }

    case "winner_take_all": {
      const winner = ranked[0];
      if (winner) {
        payouts.push({
          playerId: winner.playerId,
          playerName: winner.playerName,
          poolName: pool.name,
          place: 1,
          metricValue: winner.value,
          amount: poolAmount,
        });
      }
      break;
    }
  }

  return payouts;
}

/**
 * Calculate payouts for all pools
 */
export function calculateAllPayouts(
  pools: PoolConfig[],
  playerMetrics: PlayerMetrics[],
  potTotal: number,
): Payout[] {
  const allPayouts: Payout[] = [];

  // Calculate pool amounts with remainder tracking to match potTotal exactly
  let totalAllocated = 0;
  for (let i = 0; i < pools.length; i++) {
    const pool = pools[i];
    if (!pool) continue;

    // For last pool, give remainder to avoid rounding drift
    const isLast = i === pools.length - 1;
    const poolAmount = isLast
      ? potTotal - totalAllocated
      : Math.round((potTotal * pool.pct) / 100);

    const poolPayouts = calculatePoolPayouts(pool, playerMetrics, poolAmount);
    allPayouts.push(...poolPayouts);
    totalAllocated += poolAmount;
  }

  return allPayouts;
}

/**
 * Calculate net position for each player (winnings - buy-in)
 */
export function calculateNetPositions(
  payouts: Payout[],
  playerMetrics: PlayerMetrics[],
  potTotal: number,
): Record<string, number> {
  const playerCount = playerMetrics.length;
  if (playerCount === 0) return {};
  const buyIn = potTotal / playerCount;

  const netPositions: Record<string, number> = {};

  // Start everyone at -buyIn (they paid in)
  for (const pm of playerMetrics) {
    if (pm) {
      netPositions[pm.playerId] = -buyIn;
    }
  }

  // Add winnings
  for (const payout of payouts) {
    netPositions[payout.playerId] =
      (netPositions[payout.playerId] ?? -buyIn) + payout.amount;
  }

  // Round to avoid floating point issues
  for (const playerId of Object.keys(netPositions)) {
    const value = netPositions[playerId];
    if (value !== undefined) {
      netPositions[playerId] = Math.round(value * 100) / 100;
    }
  }

  return netPositions;
}

/**
 * Reconcile debts to minimize transactions
 *
 * Algorithm: Greedy matching of creditors and debtors
 * - A owes B $10, B owes C $10 → A pays C $20 directly
 */
export function reconcileDebts(
  netPositions: Record<string, number>,
  playerNames: Record<string, string>,
): DebtRecord[] {
  const debts: DebtRecord[] = [];

  // Separate into creditors (positive) and debtors (negative)
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];

  for (const [playerId, net] of Object.entries(netPositions)) {
    if (net > 0.01) {
      creditors.push({ id: playerId, amount: net });
    } else if (net < -0.01) {
      debtors.push({ id: playerId, amount: -net }); // Make positive
    }
  }

  // Sort by amount (largest first for efficient matching)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Greedy matching
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    if (!creditor || !debtor) break;

    const payment = Math.min(creditor.amount, debtor.amount);

    if (payment > 0.01) {
      debts.push({
        fromPlayerId: debtor.id,
        fromPlayerName: playerNames[debtor.id] ?? debtor.id,
        toPlayerId: creditor.id,
        toPlayerName: playerNames[creditor.id] ?? creditor.id,
        amount: Math.round(payment * 100) / 100,
      });
    }

    creditor.amount -= payment;
    debtor.amount -= payment;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return debts;
}

/**
 * Full settlement calculation
 */
export function calculateSettlement(
  pools: PoolConfig[],
  playerMetrics: PlayerMetrics[],
  potTotal: number,
): SettlementResult {
  if (playerMetrics.length === 0) {
    return { potTotal, buyIn: 0, payouts: [], netPositions: {}, debts: [] };
  }
  const buyIn = potTotal / playerMetrics.length;

  // Calculate all payouts
  const payouts = calculateAllPayouts(pools, playerMetrics, potTotal);

  // Calculate net positions
  const netPositions = calculateNetPositions(payouts, playerMetrics, potTotal);

  // Build player name lookup
  const playerNames: Record<string, string> = {};
  for (const pm of playerMetrics) {
    playerNames[pm.playerId] = pm.playerName;
  }

  // Reconcile debts
  const debts = reconcileDebts(netPositions, playerNames);

  return {
    potTotal,
    buyIn,
    payouts,
    netPositions,
    debts,
  };
}

// =============================================================================
// Metric Extractors (for common metrics)
// =============================================================================

/**
 * Built-in metric extractors
 * These can be extended with JSON logic in the future
 */
export type MetricExtractor = (playerId: string, gameData: unknown) => number;

/**
 * Extract quota performance metrics from game data
 * Returns { quota_front, quota_back, quota_overall }
 */
export function extractQuotaMetrics(
  quotaPerformances: Record<
    string,
    { front: number; back: number; overall: number }
  >,
): PlayerMetrics[] {
  const metrics: PlayerMetrics[] = [];

  for (const [playerId, perf] of Object.entries(quotaPerformances)) {
    metrics.push({
      playerId,
      playerName: "", // Caller should fill this in
      metrics: {
        quota_front: perf.front,
        quota_back: perf.back,
        quota_overall: perf.overall,
      },
    });
  }

  return metrics;
}

/**
 * Extract skins won from game data
 */
export function extractSkinsMetric(
  skinsWon: Record<string, number>,
): Record<string, number> {
  const metrics: Record<string, number> = {};

  for (const [playerId, count] of Object.entries(skinsWon)) {
    metrics[playerId] = count;
  }

  return metrics;
}
