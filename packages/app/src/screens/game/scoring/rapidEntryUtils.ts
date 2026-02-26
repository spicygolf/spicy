import type { Game, Player, Round } from "spicylib/schema";
import {
  adjustHandicapsToLow,
  calculateCourseHandicap,
  calculatePops,
  getEffectiveHandicap,
  getGrossScore,
  removeGrossScore,
  setGrossScore,
  setPops,
} from "spicylib/utils";

/** A player entry for the rapid entry view */
export interface PlayerEntry {
  playerName: string;
  playerId: string;
  roundToGameId: string;
  round: Round;
  /** Par values keyed by 1-indexed hole number string ("1"-"18") */
  parMap: Map<string, number>;
  /** Handicap allocations keyed by 1-indexed hole number string */
  handicapMap: Map<string, number>;
}

/** Build a filtered player list from game data */
export function buildPlayerList(
  game: Game,
  groupRoundIds?: Set<string>,
): PlayerEntry[] {
  if (!game.rounds?.$isLoaded || !game.players?.$isLoaded) return [];

  // Build playerId → Player lookup
  const playerMap = new Map<string, Player>();
  for (const p of game.players as Iterable<(typeof game.players)[number]>) {
    if (p?.$isLoaded) {
      playerMap.set(p.$jazz.id, p);
    }
  }

  const entries: PlayerEntry[] = [];

  for (const rtg of game.rounds as Iterable<(typeof game.rounds)[number]>) {
    if (!rtg?.$isLoaded) continue;

    // Filter by group if active
    if (groupRoundIds && !groupRoundIds.has(rtg.$jazz.id)) continue;

    const round = rtg.round;
    if (!round?.$isLoaded) continue;

    // Look up player name
    const player = playerMap.get(round.playerId);
    const playerName = player?.name ?? "Unknown";

    // Build par and handicap maps from tee data
    const parMap = new Map<string, number>();
    const handicapMap = new Map<string, number>();
    if (
      round.$jazz.has("tee") &&
      round.tee?.$isLoaded &&
      round.tee.holes?.$isLoaded
    ) {
      for (const h of round.tee.holes as Iterable<
        (typeof round.tee.holes)[number]
      >) {
        if (!h?.$isLoaded) continue;
        const num = String(h.number);
        parMap.set(num, h.par ?? 4);
        handicapMap.set(num, h.handicap ?? 10);
      }
    }

    entries.push({
      playerName,
      playerId: round.playerId,
      roundToGameId: rtg.$jazz.id,
      round,
      parMap,
      handicapMap,
    });
  }

  return entries;
}

/** Find the first unscored hole (1-indexed) for a round, or 1 if all scored */
export function findFirstUnscoredHole(
  round: Round,
  totalHoles: number,
): number {
  if (!round.$isLoaded || !round.scores?.$isLoaded) return 1;

  for (let i = 1; i <= totalHoles; i++) {
    const gross = getGrossScore(round, String(i));
    if (gross === null) return i;
  }
  return 1; // All scored — go back to hole 1
}

/**
 * Write a gross score (and pops if handicaps enabled) for a specific hole.
 * Mirrors useScoreManagement.handleScoreChange but takes an explicit hole number.
 */
export function writeRapidScore(
  game: Game,
  roundToGameId: string,
  holeNum: string,
  gross: number,
  holeHandicapAllocation: number,
  useHandicaps: boolean,
  handicapMode: "full" | "low",
): void {
  if (!game.rounds?.$isLoaded) return;

  const roundToGame = game.rounds.find(
    (rtg) => rtg?.$isLoaded && rtg.$jazz.id === roundToGameId,
  );

  if (!roundToGame?.$isLoaded) return;

  const round = roundToGame.round;
  if (!round?.$isLoaded || !round.scores?.$isLoaded) return;

  const owner = round.$jazz.owner;
  setGrossScore(round, holeNum, gross, owner, true);

  // Calculate and set pops if handicaps are used
  if (useHandicaps) {
    // Helper to get course handicap (stored or calculated from tee)
    const getCourseHandicap = (rtg: (typeof game.rounds)[number]): number => {
      if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) return 0;

      if (rtg.courseHandicap !== undefined) {
        return rtg.courseHandicap;
      }

      const r = rtg.round;
      if (r.$jazz.has("tee") && r.tee?.$isLoaded) {
        const handicapIndex = rtg.handicapIndex || r.handicapIndex;
        const calculated = calculateCourseHandicap({
          handicapIndex,
          tee: r.tee,
          holesPlayed: "all18",
        });
        return calculated ?? 0;
      }

      return 0;
    };

    let handicapForPops: number;

    if (handicapMode === "low") {
      const playerHandicaps = [];
      for (const rtg of game.rounds as Iterable<(typeof game.rounds)[number]>) {
        if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) continue;
        playerHandicaps.push({
          playerId: rtg.round.playerId,
          courseHandicap: getCourseHandicap(rtg),
          gameHandicap: rtg.gameHandicap,
        });
      }
      const adjusted = adjustHandicapsToLow(playerHandicaps);
      handicapForPops = adjusted.get(round.playerId) ?? 0;
    } else {
      const courseHandicap = getCourseHandicap(roundToGame);
      handicapForPops = getEffectiveHandicap(
        courseHandicap,
        roundToGame.gameHandicap,
      );
    }

    const pops = calculatePops(handicapForPops, holeHandicapAllocation);
    setPops(round, holeNum, pops, owner, true);
  }
}

/** Remove a score for a specific hole */
export function removeRapidScore(
  game: Game,
  roundToGameId: string,
  holeNum: string,
): void {
  if (!game.rounds?.$isLoaded) return;

  const roundToGame = game.rounds.find(
    (rtg) => rtg?.$isLoaded && rtg.$jazz.id === roundToGameId,
  );

  if (!roundToGame?.$isLoaded) return;

  const round = roundToGame.round;
  if (!round?.$isLoaded || !round.scores?.$isLoaded) return;

  const owner = round.$jazz.owner;
  removeGrossScore(round, holeNum, owner, true);
}
