import { co, z } from "jazz-tools";

/**
 * Settlement Schema
 *
 * Data structures for multi-pool payout calculations.
 * Designed for JSON-logic extensibility in the future.
 */

/**
 * A single payout pool configuration
 *
 * Example pools for The Big Game:
 * - { name: "front", pct: 25, metric: "quota_front", placesPaid: 3 }
 * - { name: "skins", pct: 25, metric: "skins_won", splitType: "per_unit" }
 */
export const PayoutPool = co.map({
  /** Pool identifier (e.g., "front", "back", "overall", "skins") */
  name: z.string(),

  /** Display name (e.g., "Front Nine", "Skins") */
  disp: z.string(),

  /** Percentage of total pot (0-100) */
  pct: z.number(),

  /**
   * Metric to rank players by for this pool
   * Built-in metrics: quota_front, quota_back, quota_overall, skins_won
   * Future: JSON logic expression for custom metrics
   */
  metric: z.string(),

  /**
   * How to split the pool among winners
   * - "places": Pay top N places (use placesPaid + payoutPcts)
   * - "per_unit": Split equally per unit (e.g., per skin won)
   * - "winner_take_all": Single winner takes all
   */
  splitType: z.literal(["places", "per_unit", "winner_take_all"]),

  /** Number of places paid (for splitType: "places") */
  placesPaid: z.optional(z.number()),

  /**
   * Payout percentages by place (for splitType: "places")
   * Example: [50, 30, 20] for 1st/2nd/3rd
   * If not provided, defaults based on placesPaid
   */
  payoutPcts: co.optional(co.list(z.number())),
});
export type PayoutPool = co.loaded<typeof PayoutPool>;

export const ListOfPayoutPools = co.list(PayoutPool);
export type ListOfPayoutPools = co.loaded<typeof ListOfPayoutPools>;

/**
 * A computed payout for a single player in a single pool
 */
export const PlayerPayout = co.map({
  /** Player ID */
  playerId: z.string(),

  /** Player name (denormalized for display) */
  playerName: z.string(),

  /** Pool name this payout is from */
  poolName: z.string(),

  /** Place finished (1st, 2nd, etc.) - null for per_unit splits */
  place: z.optional(z.number()),

  /** The metric value (e.g., +4 quota, 3 skins) */
  metricValue: z.number(),

  /** Amount won from this pool */
  amount: z.number(),
});
export type PlayerPayout = co.loaded<typeof PlayerPayout>;

export const ListOfPlayerPayouts = co.list(PlayerPayout);
export type ListOfPlayerPayouts = co.loaded<typeof ListOfPlayerPayouts>;

/**
 * A debt between two players (after reconciliation)
 */
export const Debt = co.map({
  /** Player who owes */
  fromPlayerId: z.string(),
  fromPlayerName: z.string(),

  /** Player who is owed */
  toPlayerId: z.string(),
  toPlayerName: z.string(),

  /** Amount owed */
  amount: z.number(),
});
export type Debt = co.loaded<typeof Debt>;

export const ListOfDebts = co.list(Debt);
export type ListOfDebts = co.loaded<typeof ListOfDebts>;

/**
 * Complete settlement for a game
 *
 * Stores both the raw payouts and the reconciled debts.
 * Reconciliation minimizes transactions (A owes B $10, B owes C $10 → A pays C $20)
 */
export const Settlement = co.map({
  /** Total pot amount */
  potTotal: z.number(),

  /** Per-player buy-in (potTotal / playerCount) */
  buyIn: z.number(),

  /** All individual payouts by pool */
  payouts: ListOfPlayerPayouts,

  /** Net position per player (positive = won, negative = lost) */
  // Stored as JSON string: { "playerId": netAmount, ... }
  netPositions: z.string(),

  /** Reconciled debts (minimized transactions) */
  debts: ListOfDebts,

  /** Timestamp of calculation */
  calculatedAt: z.date(),
});
export type Settlement = co.loaded<typeof Settlement>;
