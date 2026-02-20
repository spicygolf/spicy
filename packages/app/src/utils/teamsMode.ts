import type { GameSpec } from "spicylib/schema";
import { getSpecField } from "spicylib/scoring";

/**
 * Determines whether a spec forces teams mode based on its options.
 *
 * A spec forces teams when:
 * - team_change_every > 0 (rotating teams like Wolf)
 * - teams is true (spec explicitly requires teams)
 * - team_size > 1 (team size constraint like Vegas)
 * - num_teams > 1 (fixed team count like Five Points)
 */
export function computeSpecForcesTeams(spec: GameSpec): boolean {
  if (!spec?.$isLoaded) return false;

  const teamChangeEvery =
    (getSpecField(spec, "team_change_every") as number) ?? 0;
  const teams = (getSpecField(spec, "teams") as boolean) ?? false;
  const teamSize = (getSpecField(spec, "team_size") as number) ?? 0;
  const numTeams = (getSpecField(spec, "num_teams") as number) ?? 0;

  return teamChangeEvery > 0 || teams || teamSize > 1 || numTeams > 1;
}

/**
 * Determines whether a spec explicitly disables teams (teams: false).
 *
 * When true, the auto-threshold (playerCount > minPlayers) should NOT
 * activate teams mode — the spec is declaring this is an individual game
 * regardless of player count (e.g., The Big Game with 48 players).
 */
export function computeSpecDisablesTeams(spec: GameSpec): boolean {
  if (!spec?.$isLoaded) return false;

  const teams = getSpecField(spec, "teams");
  return teams === false;
}

/**
 * Returns the num_teams value from a spec if it's set and positive.
 * Used to determine if team count is fixed (e.g., Five Points = 2 teams).
 *
 * @param spec - The game spec to check
 * @returns The num_teams value if set and > 0, otherwise undefined
 */
export function getSpecNumTeams(spec: GameSpec): number | undefined {
  if (!spec?.$isLoaded) return undefined;
  const numTeams = (getSpecField(spec, "num_teams") as number) ?? 0;
  return numTeams > 0 ? numTeams : undefined;
}
