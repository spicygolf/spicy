import { useMemo } from "react";
import type { Game, GameSpec } from "spicylib/schema";

export interface TeamsModeResult {
  /**
   * True when teams are NOT shown to user (auto-assigned 1:1 behind the scenes).
   * This is the default mode when players <= min_players and spec doesn't force teams.
   */
  isSeamlessMode: boolean;

  /**
   * True when teams UI should be shown (drag-drop, team config, etc.).
   * Triggered by: user toggle, player count > min_players, or spec forces teams.
   */
  isTeamsMode: boolean;

  /**
   * True when the user can toggle teams on/off.
   * False when spec forces teams mode (e.g., Wolf, Five Points).
   */
  canToggle: boolean;

  /**
   * True when the spec forces teams mode (computed from teamsConfig).
   * Based on: rotateEvery > 0, teamCount < min_players, or maxPlayersPerTeam > 1.
   */
  specForcesTeams: boolean;

  /**
   * Minimum players required by the spec(s).
   * When multiple specs, uses the minimum of all.
   */
  minPlayers: number;

  /**
   * Current number of players in the game.
   */
  playerCount: number;

  /**
   * True if player count exceeds min_players (auto-activates teams mode).
   */
  isOverThreshold: boolean;

  /**
   * True if user has manually toggled teams on via teamsConfig.active.
   */
  isUserActivated: boolean;
}

/**
 * Determines whether a spec forces teams mode based on its teamsConfig.
 *
 * A spec forces teams when:
 * - rotateEvery > 0 (rotating teams like Wolf)
 * - teamCount < min_players (true team game like Five Points with 2 teams for 4 players)
 * - maxPlayersPerTeam > 1 (team size constraint like Vegas)
 */
export function computeSpecForcesTeams(spec: GameSpec): boolean {
  if (!spec?.$isLoaded) return false;

  const tc = spec.teamsConfig;
  if (!tc?.$isLoaded) return false;

  const rotateEvery = tc.rotateEvery ?? 0;
  const minPlayers = spec.min_players ?? 2;
  const teamCount = tc.teamCount ?? minPlayers;
  const maxPlayersPerTeam = tc.maxPlayersPerTeam ?? 0;

  return rotateEvery > 0 || teamCount < minPlayers || maxPlayersPerTeam > 1;
}

/**
 * Hook to determine the teams mode for a game.
 *
 * Teams mode is determined by (in order of priority):
 * 1. Spec forces teams (rotateEvery > 0, teamCount < min_players, or maxPlayersPerTeam > 1)
 * 2. User toggle (game.scope.teamsConfig.active = true)
 * 3. Player count > min_players (auto-activates)
 *
 * @param game - The game to check (must have scope.teamsConfig and players resolved)
 * @param specs - The game specs (must have teamsConfig resolved)
 *
 * @example
 * const { game } = useGame(id, {
 *   resolve: {
 *     scope: { teamsConfig: true },
 *     players: { $each: true },
 *     specs: { $each: { teamsConfig: true } },
 *   }
 * });
 * const { isSeamlessMode, isTeamsMode, canToggle } = useTeamsMode(game);
 */
export function useTeamsMode(
  game: Game | null | undefined,
  specs?: GameSpec[] | null,
): TeamsModeResult {
  return useMemo(() => {
    // Default values when game not loaded
    const defaults: TeamsModeResult = {
      isSeamlessMode: true,
      isTeamsMode: false,
      canToggle: true,
      specForcesTeams: false,
      minPlayers: 2,
      playerCount: 0,
      isOverThreshold: false,
      isUserActivated: false,
    };

    if (!game?.$isLoaded) return defaults;

    // Get specs from parameter or from game
    const gameSpecs: GameSpec[] = specs ?? [];
    if (!specs && game.specs?.$isLoaded) {
      for (const spec of game.specs) {
        if (spec?.$isLoaded) {
          gameSpecs.push(spec);
        }
      }
    }

    // Calculate min_players from specs
    const minPlayers =
      gameSpecs.length > 0
        ? Math.min(...gameSpecs.map((s) => s.min_players ?? 2))
        : 2;

    // Count players
    const playerCount = game.players?.$isLoaded ? game.players.length : 0;

    // Check if any spec forces teams
    const specForcesTeams = gameSpecs.some(computeSpecForcesTeams);

    // Check if user has manually activated teams
    const isUserActivated = Boolean(
      game.scope?.$isLoaded &&
        game.scope.teamsConfig?.$isLoaded &&
        game.scope.teamsConfig.active === true,
    );

    // Check if over player threshold
    const isOverThreshold = playerCount > minPlayers;

    // Determine mode
    const isTeamsMode = specForcesTeams || isUserActivated || isOverThreshold;
    const isSeamlessMode = !isTeamsMode;
    const canToggle = !specForcesTeams;

    return {
      isSeamlessMode,
      isTeamsMode,
      canToggle,
      specForcesTeams,
      minPlayers,
      playerCount,
      isOverThreshold,
      isUserActivated,
    };
  }, [game, specs]);
}
