import type { Game, GameSpec } from "spicylib/schema";
import type { PlayerQuota, Scoreboard } from "spicylib/scoring";
import {
  getMetaOption,
  getTeamHolePoints,
  isHoleComplete,
} from "spicylib/scoring";

export type ViewMode = "gross" | "net" | "points" | "skins";

export interface PlayerColumn {
  playerId: string;
  firstName: string;
  lastName: string;
}

export interface HoleData {
  hole: string;
  par: number;
  isSummaryRow: boolean;
  summaryType?: "out" | "in" | "total";
}

/**
 * Find which team a player belongs to on a given hole
 */
function findPlayerTeam(
  scoreboard: Scoreboard,
  playerId: string,
  hole: string,
): string | null {
  const holeResult = scoreboard.holes[hole];
  if (!holeResult) return null;

  for (const [teamId, teamResult] of Object.entries(holeResult.teams)) {
    if (teamResult.playerIds.includes(playerId)) {
      return teamId;
    }
  }
  return null;
}

/**
 * Get team points for a player on a hole.
 * For 2-team games returns holeNetTotal (net vs opponent).
 * For individual/multi-team games returns absolute points.
 */
function getTeamPointsForPlayer(
  scoreboard: Scoreboard,
  playerId: string,
  hole: string,
): number | null {
  const teamId = findPlayerTeam(scoreboard, playerId, hole);
  if (!teamId) return null;

  const holeResult = scoreboard.holes[hole];
  if (!holeResult) return null;

  const teamResult = holeResult.teams[teamId];
  if (!teamResult) return null;

  return getTeamHolePoints(teamResult);
}

/**
 * Get player columns from game data
 */
export function getPlayerColumns(game: Game): PlayerColumn[] {
  if (!game.players?.$isLoaded) return [];

  const columns: PlayerColumn[] = [];
  for (const player of game.players) {
    if (!player?.$isLoaded) continue;

    const nameParts = (player.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    columns.push({
      playerId: player.$jazz.id,
      firstName,
      lastName,
    });
  }
  return columns;
}

/**
 * Get hole rows including Out/In/Total summary rows
 */
export function getHoleRows(game: Game): HoleData[] {
  if (!game.rounds?.$isLoaded || game.rounds.length === 0) return [];

  // Get par for each hole from the first player's tee
  const firstRtg = game.rounds[0];
  if (!firstRtg?.$isLoaded) return [];

  const round = firstRtg.round;
  if (!round?.$isLoaded || !round.$jazz.has("tee")) return [];

  const tee = round.tee;
  if (!tee?.$isLoaded || !tee.holes?.$isLoaded) return [];

  const rows: HoleData[] = [];
  const holeCount = tee.holes.length;
  const hasFrontNine = holeCount >= 9;
  const hasBackNine = holeCount >= 18;

  // Front 9
  for (let i = 0; i < Math.min(9, holeCount); i++) {
    const hole = tee.holes[i];
    if (hole?.$isLoaded) {
      rows.push({
        hole: hole.number?.toString() || String(i + 1),
        par: hole.par ?? 4,
        isSummaryRow: false,
      });
    }
  }

  // Out row (front 9 summary)
  if (hasFrontNine) {
    rows.push({
      hole: "Out",
      par: 0, // Will be calculated
      isSummaryRow: true,
      summaryType: "out",
    });
  }

  // Back 9
  for (let i = 9; i < Math.min(18, holeCount); i++) {
    const hole = tee.holes[i];
    if (hole?.$isLoaded) {
      rows.push({
        hole: hole.number?.toString() || String(i + 1),
        par: hole.par ?? 4,
        isSummaryRow: false,
      });
    }
  }

  // In row (back 9 summary)
  if (hasBackNine) {
    rows.push({
      hole: "In",
      par: 0,
      isSummaryRow: true,
      summaryType: "in",
    });
  }

  // Total row
  if (holeCount > 0) {
    rows.push({
      hole: "Total",
      par: 0,
      isSummaryRow: true,
      summaryType: "total",
    });
  }

  return rows;
}

/**
 * Get score value for a player on a hole
 */
export function getScoreValue(
  scoreboard: Scoreboard | null,
  playerId: string,
  hole: string,
  viewMode: ViewMode,
): number | null {
  if (!scoreboard) return null;

  const holeResult = scoreboard.holes[hole];
  if (!holeResult) return null;

  const playerResult = holeResult.players[playerId];
  if (!playerResult) return null;

  // Return null if no score has been entered for this hole
  if (!playerResult.hasScore) return null;

  switch (viewMode) {
    case "gross":
      return playerResult.gross;
    case "net":
      return playerResult.net;
    case "points":
      // Don't show points for incomplete holes
      if (!isHoleComplete(scoreboard.holes[hole])) return null;
      // For team games, show the team's hole net total (vs opponent)
      // Fall back to individual player points if no team data
      return (
        getTeamPointsForPlayer(scoreboard, playerId, hole) ??
        playerResult.points
      );
    case "skins": {
      if (!isHoleComplete(scoreboard.holes[hole])) return null;
      // Count skins won by this player on this hole
      const skinCount = playerResult.junk.filter(
        (j) => j.subType === "skin",
      ).length;
      return skinCount > 0 ? skinCount : null;
    }
  }
}

/**
 * Get summary value (Out/In/Total) for a player
 */
export function getSummaryValue(
  scoreboard: Scoreboard | null,
  playerId: string,
  summaryType: "out" | "in" | "total",
  viewMode: ViewMode,
  playerQuotas?: Map<string, PlayerQuota> | null,
): number | null {
  if (!scoreboard) return null;

  const cumulative = scoreboard.cumulative.players[playerId];
  if (!cumulative) return null;

  // For skins, count skin junk across holes in range
  if (viewMode === "skins") {
    let total = 0;
    const holes = Object.keys(scoreboard.holes);

    for (const hole of holes) {
      const holeNum = Number.parseInt(hole, 10);
      if (Number.isNaN(holeNum)) continue;

      const inRange =
        summaryType === "out"
          ? holeNum >= 1 && holeNum <= 9
          : summaryType === "in"
            ? holeNum >= 10 && holeNum <= 18
            : true;

      if (inRange) {
        if (!isHoleComplete(scoreboard.holes[hole])) continue;
        const playerResult = scoreboard.holes[hole]?.players[playerId];
        if (playerResult) {
          total += playerResult.junk.filter((j) => j.subType === "skin").length;
        }
      }
    }
    return total > 0 ? total : null;
  }

  // For points, calculate from team hole net totals
  if (viewMode === "points") {
    const quota = playerQuotas?.get(playerId);
    let total = 0;
    const holes = Object.keys(scoreboard.holes);

    for (const hole of holes) {
      const holeNum = Number.parseInt(hole, 10);
      if (Number.isNaN(holeNum)) continue;

      const inRange =
        summaryType === "out"
          ? holeNum >= 1 && holeNum <= 9
          : summaryType === "in"
            ? holeNum >= 10 && holeNum <= 18
            : true;

      if (inRange) {
        // Skip incomplete holes
        if (!isHoleComplete(scoreboard.holes[hole])) continue;

        if (quota) {
          // Quota games: sum only dot-type junk (stableford scoring dots).
          // This must match the settlement engine's extractStablefordTotals
          // so ranks and payouts are consistent with displayed values.
          const playerResult = scoreboard.holes[hole]?.players[playerId];
          if (playerResult) {
            for (const junk of playerResult.junk) {
              if (junk.subType === "dot") {
                total += junk.value;
              }
            }
          }
        } else {
          // Non-quota games: use team points (includes all junk × multiplier)
          const teamPoints = getTeamPointsForPlayer(scoreboard, playerId, hole);
          if (teamPoints !== null) {
            total += teamPoints;
          } else {
            const playerResult = scoreboard.holes[hole]?.players[playerId];
            if (playerResult) {
              total += playerResult.points;
            }
          }
        }
      }
    }

    // For quota games, subtract quota to show performance (e.g., +2 over quota)
    if (quota) {
      // quota.front/back are play-order aligned (first nine played / second nine played).
      // The "out"/"in" summary rows show physical course sides (holes 1-9 / 10-18).
      // For shotgun starts, these don't match — if play starts on hole 10+,
      // physical "out" (1-9) was the second nine played, so use quota.back.
      const firstHole = scoreboard.meta.holesPlayed[0];
      const startsOnBack =
        firstHole !== undefined && Number.parseInt(firstHole, 10) >= 10;
      const outQuota = startsOnBack ? quota.back : quota.front;
      const inQuota = startsOnBack ? quota.front : quota.back;

      const quotaValue =
        summaryType === "out"
          ? outQuota
          : summaryType === "in"
            ? inQuota
            : quota.total;
      return total - quotaValue;
    }

    return total;
  }

  // For gross/net, calculate from holes
  let total = 0;
  let hasAnyScore = false;
  const holes = Object.keys(scoreboard.holes);

  for (const hole of holes) {
    const holeNum = Number.parseInt(hole, 10);
    if (Number.isNaN(holeNum)) continue;

    const inRange =
      summaryType === "out"
        ? holeNum >= 1 && holeNum <= 9
        : summaryType === "in"
          ? holeNum >= 10 && holeNum <= 18
          : true;

    if (inRange) {
      const playerResult = scoreboard.holes[hole]?.players[playerId];
      if (playerResult) {
        total += viewMode === "gross" ? playerResult.gross : playerResult.net;
        hasAnyScore = true;
      }
    }
  }

  return hasAnyScore ? total : null;
}

/**
 * Get number of pops (handicap strokes) for a player on a hole
 * Returns 0, 1, 2, or 3 depending on handicap differential
 */
export function getPopsCount(
  scoreboard: Scoreboard | null,
  playerId: string,
  hole: string,
): number {
  if (!scoreboard) return 0;

  const holeResult = scoreboard.holes[hole];
  if (!holeResult) return 0;

  const playerResult = holeResult.players[playerId];
  if (!playerResult) return 0;

  return playerResult.pops;
}

/**
 * Get score-to-par for decoration
 */
export function getScoreToPar(
  scoreboard: Scoreboard | null,
  playerId: string,
  hole: string,
  viewMode: ViewMode,
): number | null {
  if (!scoreboard || viewMode === "points" || viewMode === "skins") return null;

  const holeResult = scoreboard.holes[hole];
  if (!holeResult) return null;

  const playerResult = holeResult.players[playerId];
  if (!playerResult) return null;

  // For gross: gross - par, for net: net - par
  return viewMode === "gross" ? playerResult.scoreToPar : playerResult.netToPar;
}

// =============================================================================
// Vertical Leaderboard Helpers
// =============================================================================

export interface VerticalColumn {
  key: string;
  label: string;
  /** Which summary type to use for getSummaryValue() */
  summaryType: "out" | "in" | "total";
  /** Override viewMode for this column (e.g., skins always uses "skins") */
  viewModeOverride?: ViewMode;
}

export interface VerticalPlayerData {
  playerId: string;
  firstName: string;
  lastName: string;
  rank: number;
  values: Record<string, number | null>;
}

/** Bet info needed for column derivation and settlement */
export interface BetColumnInfo {
  name: string;
  disp: string;
  scope: string;
  scoringType: string;
  pct?: number;
  splitType?: string;
  placesPaid?: number;
}

const SCOPE_TO_SUMMARY: Record<string, "out" | "in" | "total"> = {
  front9: "out",
  back9: "in",
  all18: "total",
};

/**
 * Derive column definitions from game bets.
 * Falls back to Front/Back/Total when no bets are available.
 */
export function getVerticalColumns(bets: BetColumnInfo[]): VerticalColumn[] {
  if (bets.length === 0) {
    return [
      { key: "front", label: "Front", summaryType: "out" },
      { key: "back", label: "Back", summaryType: "in" },
      { key: "total", label: "Total", summaryType: "total" },
    ];
  }

  return bets
    .filter((bet) => SCOPE_TO_SUMMARY[bet.scope] !== undefined)
    .map((bet) => ({
      key: bet.name,
      label: bet.disp,
      summaryType: SCOPE_TO_SUMMARY[bet.scope] as "out" | "in" | "total",
      viewModeOverride:
        bet.scoringType === "skins" ? ("skins" as ViewMode) : undefined,
    }));
}

/**
 * Get player data for the vertical leaderboard, sorted by rank.
 * Reuses getSummaryValue() for all computations.
 */
export function getVerticalPlayerData(
  scoreboard: Scoreboard | null,
  playerColumns: PlayerColumn[],
  columns: VerticalColumn[],
  viewMode: ViewMode,
  playerQuotas: Map<string, PlayerQuota> | null | undefined,
): VerticalPlayerData[] {
  const rows: VerticalPlayerData[] = [];

  for (const player of playerColumns) {
    const values: Record<string, number | null> = {};

    for (const col of columns) {
      // In gross mode, ignore column overrides — all columns show gross scores.
      // In bets mode (viewMode="points"), skins columns override to "skins".
      const effectiveViewMode =
        viewMode === "gross" ? "gross" : (col.viewModeOverride ?? viewMode);
      values[col.key] = getSummaryValue(
        scoreboard,
        player.playerId,
        col.summaryType,
        effectiveViewMode,
        playerQuotas,
      );
    }

    const cumulative = scoreboard?.cumulative.players[player.playerId];
    const rank = cumulative?.rank ?? playerColumns.indexOf(player) + 1;

    rows.push({
      playerId: player.playerId,
      firstName: player.firstName,
      lastName: player.lastName,
      rank,
      values,
    });
  }

  // Sort by rank (ascending)
  rows.sort((a, b) => a.rank - b.rank);

  return rows;
}

/**
 * Extract BetColumnInfo from a game, falling back to spec JSON for legacy games.
 * Computed directly (no useMemo) because game.bets is a Jazz reactive proxy.
 */
export function extractBets(
  game: Game | null,
  gameSpec: GameSpec | undefined,
): BetColumnInfo[] {
  if (game?.bets?.$isLoaded && game.bets.length > 0) {
    const result: BetColumnInfo[] = [];
    for (const bet of game.bets) {
      if (!bet?.$isLoaded) continue;
      result.push({
        name: bet.name,
        disp: bet.disp,
        scope: bet.scope,
        scoringType: bet.scoringType,
        pct: bet.pct,
        splitType: bet.splitType,
        placesPaid: bet.placesPaid ?? undefined,
      });
    }
    if (result.length > 0) return result;
  }

  // Fallback: read bet options from spec options map
  if (!gameSpec?.$isLoaded) return [];

  const specBets: BetColumnInfo[] = [];
  for (const key of Object.keys(gameSpec)) {
    if (key.startsWith("$") || key.startsWith("_")) continue;
    if (!gameSpec.$jazz.has(key)) continue;
    const opt = gameSpec[key];
    if (opt?.type === "bet") {
      specBets.push({
        name: opt.name,
        disp: opt.disp,
        scope: opt.scope,
        scoringType: opt.scoringType,
        pct: opt.pct,
        splitType: opt.splitType,
      });
    }
  }
  if (specBets.length > 0) return specBets;

  // Legacy fallback: parse bets from JSON meta option
  const betsJson = getMetaOption(gameSpec, "bets") as string | undefined;
  if (!betsJson) return [];
  try {
    const parsed = JSON.parse(betsJson) as BetColumnInfo[];
    return parsed.filter((b) => b.name && b.disp && b.scope && b.scoringType);
  } catch {
    return [];
  }
}
