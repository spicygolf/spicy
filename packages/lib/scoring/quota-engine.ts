/**
 * Quota Engine
 *
 * Pure calculation functions for the quota/Stableford scoring system.
 * Used by The Big Game (Chicago / Quota) and future quota-based games.
 *
 * Quota = 36 - courseHandicap (36 = 18 holes × 2 stableford points for par).
 * Performance = stableford points earned - quota.
 */

/**
 * Calculate a player's 18-hole quota from their course handicap.
 *
 * Formula: quota = 36 - courseHandicap
 * (36 = 18 holes × 2 stableford points for par)
 *
 * @param courseHandicap - Player's course handicap (negative for plus handicaps)
 * @returns Quota target (higher handicap = lower quota)
 *
 * @example
 * calculateQuota(0)   // 36 (scratch)
 * calculateQuota(10)  // 26
 * calculateQuota(-4)  // 40 (plus handicap)
 */
export function calculateQuota(courseHandicap: number): number {
  return 36 - courseHandicap;
}

interface NineHoleQuotaParams {
  /** Total 18-hole quota (from calculateQuota) */
  totalQuota: number;
  /** Front nine slope rating (for difficulty comparison) */
  frontSlope?: number | null;
  /** Back nine slope rating (for difficulty comparison) */
  backSlope?: number | null;
}

/**
 * Split an 18-hole quota into front and back nine quotas.
 *
 * Uses Approach A: split the total quota, with odd remainder going to the
 * easier nine (lower slope = easier). Guarantees front + back = total.
 *
 * @param params.totalQuota - The 18-hole quota to split
 * @param params.frontSlope - Front nine slope (higher = harder)
 * @param params.backSlope - Back nine slope (higher = harder)
 * @returns Front and back nine quotas that sum to totalQuota
 *
 * @example
 * // Even split
 * calculateNineHoleQuotas({ totalQuota: 28 }) // { front: 14, back: 14 }
 *
 * // Odd split, front harder (higher slope) — extra point to easier back nine
 * calculateNineHoleQuotas({ totalQuota: 29, frontSlope: 140, backSlope: 130 })
 * // { front: 14, back: 15 }
 *
 * // Odd split, back harder (higher slope) — extra point to easier front nine
 * calculateNineHoleQuotas({ totalQuota: 29, frontSlope: 130, backSlope: 140 })
 * // { front: 15, back: 14 }
 */
export function calculateNineHoleQuotas({
  totalQuota,
  frontSlope,
  backSlope,
}: NineHoleQuotaParams): { front: number; back: number } {
  // Even quota: split evenly
  if (totalQuota % 2 === 0) {
    const half = totalQuota / 2;
    return { front: half, back: half };
  }

  // Odd quota: the harder nine gets the lower quota (fewer points expected),
  // so the extra point goes to the easier nine.
  // Higher slope = harder course.
  const base = Math.floor(totalQuota / 2);
  const fs = frontSlope ?? 113;
  const bs = backSlope ?? 113;

  // Front harder (higher slope) → front gets base, back gets base+1
  // Back harder (higher slope) → back gets base, front gets base+1
  // Equal slopes → back gets the remainder by default
  if (fs > bs) {
    return { front: base, back: base + 1 };
  }
  if (bs > fs) {
    return { front: base + 1, back: base };
  }
  // Equal: back gets remainder
  return { front: base, back: base + 1 };
}

/**
 * Calculate quota performance: stableford points minus quota.
 *
 * @param stablefordPoints - Points earned in the scope
 * @param quota - Quota target for the scope
 * @returns Performance (positive = over quota, negative = under)
 *
 * @example
 * calculateQuotaPerformance(18, 14)  // +4 (over quota)
 * calculateQuotaPerformance(12, 14)  // -2 (under quota)
 */
export function calculateQuotaPerformance(
  stablefordPoints: number,
  quota: number,
): number {
  return stablefordPoints - quota;
}
