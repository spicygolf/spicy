import { co, z } from "jazz-tools";

/**
 * Settlement Schema
 *
 * Data structures for multi-pool payout calculations.
 * Designed for JSON-logic extensibility in the future.
 */

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
