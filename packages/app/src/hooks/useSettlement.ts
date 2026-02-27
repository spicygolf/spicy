import { useMemo } from "react";
import type { Game } from "spicylib/schema";
import type {
  BetConfig,
  Scoreboard,
  ScoringContext,
  SettlementResult,
} from "spicylib/scoring";
import { getGameOptionNumber, settleBets } from "spicylib/scoring";
import type { BetColumnInfo } from "@/components/game/leaderboard";

const VALID_SCOPES = new Set(["front9", "back9", "all18"]);
const VALID_SCORING_TYPES = new Set(["quota", "skins", "points", "match"]);
const VALID_SPLIT_TYPES = new Set(["places", "per_unit", "winner_take_all"]);

/**
 * Compute settlement (payouts, net positions, debts) for a pool-funded game.
 *
 * Returns null when the game doesn't use pool funding (no buy-in or no bets).
 * The result is memoized based on the scoreboard reference (which is already
 * fingerprint-gated by useScoreboard) and game option values.
 *
 * @param game - The loaded game object (for players and options)
 * @param scoreboard - Scored scoreboard from useScoreboard
 * @param scoringContext - Scoring context (for playerQuotas)
 * @param bets - Bet column info extracted from game.bets
 * @returns Settlement result, or null if not applicable
 */
export function useSettlement(
  game: Game | null,
  scoreboard: Scoreboard | null,
  scoringContext: ScoringContext | null,
  bets: BetColumnInfo[],
): SettlementResult | null {
  const buyIn = getGameOptionNumber(game?.spec, "buy_in", 0);
  const placesPaid = getGameOptionNumber(game?.spec, "places_paid", 3);

  return useMemo(() => {
    if (
      !game?.players?.$isLoaded ||
      !scoreboard ||
      buyIn <= 0 ||
      bets.length === 0
    ) {
      return null;
    }

    // Convert BetColumnInfo to BetConfig
    const betConfigs: BetConfig[] = [];
    for (const b of bets) {
      if (
        !VALID_SCOPES.has(b.scope) ||
        !VALID_SCORING_TYPES.has(b.scoringType)
      ) {
        continue;
      }
      betConfigs.push({
        name: b.name,
        disp: b.disp,
        scope: b.scope as BetConfig["scope"],
        scoringType: b.scoringType as BetConfig["scoringType"],
        pct: b.pct ?? 100 / bets.length,
        splitType: VALID_SPLIT_TYPES.has(b.splitType ?? "")
          ? (b.splitType as BetConfig["splitType"])
          : "places",
        // Omit bet-level placesPaid — always use game option (defaultPlacesPaid)
        // so changes from PlacesPaidScreen take effect immediately.
        placesPaid: undefined,
      });
    }

    if (betConfigs.length === 0) return null;

    // Build player list
    const players: Array<{ id: string; name: string }> = [];
    for (const player of game.players) {
      if (!player?.$isLoaded) continue;
      players.push({ id: player.$jazz.id, name: player.name });
    }

    if (players.length === 0) return null;

    return settleBets({
      bets: betConfigs,
      players,
      scoreboard,
      playerQuotas: scoringContext?.playerQuotas,
      buyIn,
      defaultPlacesPaid: placesPaid,
    });
  }, [game, scoreboard, scoringContext?.playerQuotas, buyIn, placesPaid, bets]);
}
