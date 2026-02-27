import { co, z } from "jazz-tools";

/**
 * A Bet is a scored sub-competition within a game.
 *
 * Every game has at least one bet. Games like Five Points have a single
 * implicit bet covering all 18 holes. Big Game has four explicit bets
 * (front/back/overall quota + skins). Nassau has three (front/back/overall
 * match) plus dynamic press bets created mid-round.
 *
 * Scope is based on game.holes list indices (play order), not hole numbers.
 * This handles shotgun starts (#106) where play may begin on any hole.
 */
export const Bet = co.map({
  /** Bet identifier (e.g., "front", "back", "overall", "skins", "press_1") */
  name: z.string(),

  /** Display name (e.g., "Front", "Skins", "Press (Hole 7)") */
  disp: z.string(),

  /**
   * Which holes this bet covers, based on game.holes list indices (0-based play order).
   * - "front9": indices 0-8 (first nine in play order)
   * - "back9": indices 9-17 (second nine in play order)
   * - "all18": all indices
   * - "rest_of_nine": startHoleIndex through end of current nine (index 8 or 17)
   * - "rest_of_round": startHoleIndex through last hole
   */
  scope: z.enum(["front9", "back9", "all18", "rest_of_nine", "rest_of_round"]),

  /**
   * Starting game.holes index for dynamic bets (presses).
   * Only meaningful when scope is "rest_of_nine" or "rest_of_round".
   * 0-based index into game.holes (play order, not hole number).
   */
  startHoleIndex: z.optional(z.number()),

  /**
   * How players/teams are ranked in this bet.
   * - "quota": stableford points minus quota (higher is better)
   * - "skins": count of skins won
   * - "points": cumulative point differential (existing games like Five Points)
   * - "match": hole-by-hole match play result
   */
  scoringType: z.enum(["quota", "skins", "points", "match"]),

  /** Percentage of total pot (0-100). For single-bet games, always 100. */
  pct: z.number(),

  /**
   * How to split the bet's portion among winners.
   * - "places": pay top N places (use placesPaid + payoutPcts)
   * - "per_unit": split equally per unit (per skin, per point, etc.)
   * - "winner_take_all": single winner takes all
   */
  splitType: z.enum(["places", "per_unit", "winner_take_all"]),

  /** Number of places paid (for splitType: "places") */
  placesPaid: z.optional(z.number()),

  /** Custom payout percentages by place */
  payoutPcts: co.optional(co.list(z.number())),
});
export type Bet = co.loaded<typeof Bet>;

export const ListOfBets = co.list(Bet);
export type ListOfBets = co.loaded<typeof ListOfBets>;
