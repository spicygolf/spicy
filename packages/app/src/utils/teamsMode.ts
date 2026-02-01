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
