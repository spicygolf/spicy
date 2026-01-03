import { FlatList } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type {
  Game,
  GameHole,
  JunkOption,
  MultiplierOption,
  Team,
} from "spicylib/schema";
import { ListOfTeamOptions, TeamOption } from "spicylib/schema";
import {
  adjustHandicapsToLow,
  calculateCourseHandicap,
  calculateNetScore,
  calculatePops,
  getEffectiveHandicap,
  getGrossScore,
} from "spicylib/utils";
import {
  HoleHeader,
  PlayerScoreRow,
  TeamGroup,
} from "@/components/game/scoring";
import type { HoleInfo } from "@/hooks";
import { useOptionValue } from "@/hooks/useOptionValue";

export interface ScoringViewProps {
  game: Game;
  holeInfo: HoleInfo;
  currentHole: GameHole | null;
  currentHoleIndex: number;
  onPrevHole: () => void;
  onNextHole: () => void;
  onScoreChange: (roundToGameId: string, newGross: number) => void;
  onUnscore: (roundToGameId: string) => void;
  onChangeTeams: () => void;
}

/**
 * Get user-markable junk options from game spec
 * These are junk options with based_on: "user" and show_in: "score" or "faves"
 */
function getUserJunkOptions(game: Game): JunkOption[] {
  const junkOptions: JunkOption[] = [];

  // Get options from game spec
  const spec = game.specs?.$isLoaded ? game.specs[0] : null;
  if (!spec?.$isLoaded) return junkOptions;

  const options = spec.options;
  if (!options?.$isLoaded) return junkOptions;

  for (const key of Object.keys(options)) {
    const opt = options[key];
    if (
      opt?.$isLoaded &&
      opt.type === "junk" &&
      opt.based_on === "user" &&
      (opt.show_in === "score" || opt.show_in === "faves")
    ) {
      junkOptions.push(opt);
    }
  }

  // Sort by seq
  junkOptions.sort((a, b) => (a.seq ?? 999) - (b.seq ?? 999));

  return junkOptions;
}

/**
 * Check if a player has a specific junk option on this hole
 */
function hasPlayerJunk(
  team: Team,
  playerId: string,
  junkName: string,
): boolean {
  if (!team.options?.$isLoaded) return false;

  for (const opt of team.options) {
    if (
      opt?.$isLoaded &&
      opt.optionName === junkName &&
      opt.playerId === playerId &&
      opt.value === "true"
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Toggle a junk option for a player on a team
 * Creates the options list if it doesn't exist, then adds or removes the junk
 */
function togglePlayerJunk(
  team: Team,
  playerId: string,
  junkName: string,
): void {
  // Ensure options list exists using Jazz pattern
  if (!team.$jazz.has("options")) {
    team.$jazz.set("options", ListOfTeamOptions.create([]));
  }

  const options = team.options;
  if (!options?.$isLoaded) return;

  // Find existing option for this player and junk
  let existingIndex = -1;
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    if (
      opt?.$isLoaded &&
      opt.optionName === junkName &&
      opt.playerId === playerId
    ) {
      existingIndex = i;
      break;
    }
  }

  if (existingIndex >= 0) {
    // Remove existing option (toggle off)
    options.$jazz.splice(existingIndex, 1);
  } else {
    // Add new option (toggle on)
    const newOption = TeamOption.create({
      optionName: junkName,
      value: "true",
      playerId,
    });
    options.$jazz.push(newOption);
  }
}

/**
 * Get team-scoped multiplier options from game spec
 * These are multiplier options with based_on: "user"
 */
function getMultiplierOptions(game: Game): MultiplierOption[] {
  const multiplierOptions: MultiplierOption[] = [];

  const spec = game.specs?.$isLoaded ? game.specs[0] : null;
  if (!spec?.$isLoaded) return multiplierOptions;

  const options = spec.options;
  if (!options?.$isLoaded) return multiplierOptions;

  for (const key of Object.keys(options)) {
    const opt = options[key];
    if (
      opt?.$isLoaded &&
      opt.type === "multiplier" &&
      opt.based_on === "user"
    ) {
      multiplierOptions.push(opt);
    }
  }

  multiplierOptions.sort((a, b) => (a.seq ?? 999) - (b.seq ?? 999));
  return multiplierOptions;
}

/**
 * Check if a team has a specific multiplier active on this hole
 * Presence of the option means it's active (value check not needed)
 */
function hasTeamMultiplier(team: Team, multiplierName: string): boolean {
  if (!team.options?.$isLoaded) return false;

  for (const opt of team.options) {
    if (
      opt?.$isLoaded &&
      opt.optionName === multiplierName &&
      !opt.playerId // Team-level (no player)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Toggle a multiplier for a team
 */
function toggleTeamMultiplier(team: Team, multiplierName: string): void {
  if (!team.$jazz.has("options")) {
    team.$jazz.set("options", ListOfTeamOptions.create([]));
  }

  const options = team.options;
  if (!options?.$isLoaded) return;

  // Find existing team-level option
  let existingIndex = -1;
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    if (
      opt?.$isLoaded &&
      opt.optionName === multiplierName &&
      !opt.playerId // Team-level
    ) {
      existingIndex = i;
      break;
    }
  }

  if (existingIndex >= 0) {
    options.$jazz.splice(existingIndex, 1);
  } else {
    const newOption = TeamOption.create({
      optionName: multiplierName,
      value: "true", // Value required by schema, presence indicates active
    });
    options.$jazz.push(newOption);
  }
}

export function ScoringView({
  game,
  holeInfo,
  currentHole,
  currentHoleIndex,
  onPrevHole,
  onNextHole,
  onScoreChange,
  onUnscore,
  onChangeTeams,
}: ScoringViewProps) {
  // Get user-markable junk options for this game (player-scoped)
  const userJunkOptions = getUserJunkOptions(game);

  // Get multiplier options for this game (team-scoped)
  const multiplierOptions = getMultiplierOptions(game);

  // Check if handicaps are used in this game
  const useHandicapsValue = useOptionValue(
    game,
    currentHole,
    "use_handicaps",
    "game",
  );
  const useHandicaps =
    useHandicapsValue === "true" || useHandicapsValue === "1";

  // Check handicap mode from game options
  // Options come from gamespec, with optional hole-level overrides
  const handicapIndexFromValue = useOptionValue(
    game,
    currentHole,
    "handicap_index_from",
    "game",
  );
  const handicapMode = handicapIndexFromValue === "low" ? "low" : "full";

  // Build adjusted handicaps map if in "low" mode and handicaps are used
  // Also build a map of calculated course handicaps for use in the render loop
  let adjustedHandicaps: Map<string, number> | null = null;
  const calculatedCourseHandicaps = new Map<string, number>();

  if (useHandicaps && game.rounds?.$isLoaded) {
    // First pass: calculate course handicaps for all players
    for (const rtg of game.rounds) {
      if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) continue;

      const round = rtg.round;
      let courseHandicap = rtg.courseHandicap;

      // If courseHandicap is not set, calculate it from the tee data
      if (courseHandicap === undefined && round.$jazz.has("tee")) {
        const tee = round.tee;
        if (tee?.$isLoaded) {
          const handicapIndex = rtg.handicapIndex || round.handicapIndex;
          const calculated = calculateCourseHandicap({
            handicapIndex,
            tee,
            holesPlayed: "all18", // TODO: Get from game.scope.holes
          });
          courseHandicap = calculated ?? undefined;
        }
      }

      calculatedCourseHandicaps.set(round.playerId, courseHandicap ?? 0);
    }

    // Second pass: build adjusted handicaps if in "low" mode
    if (handicapMode === "low") {
      const playerHandicaps = [];
      for (const rtg of game.rounds) {
        if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) continue;

        const courseHandicap =
          calculatedCourseHandicaps.get(rtg.round.playerId) ?? 0;

        playerHandicaps.push({
          playerId: rtg.round.playerId,
          courseHandicap,
          gameHandicap: rtg.gameHandicap,
        });
      }
      adjustedHandicaps = adjustHandicapsToLow(playerHandicaps);
    }
  }

  return (
    <>
      <HoleHeader hole={holeInfo} onPrevious={onPrevHole} onNext={onNextHole} />
      <FlatList
        style={styles.content}
        data={currentHole?.teams?.$isLoaded ? [...currentHole.teams] : []}
        keyExtractor={(team) => team?.$jazz.id ?? "unknown"}
        renderItem={({ item: team }) => {
          if (!team?.$isLoaded || !team.rounds?.$isLoaded) {
            return null;
          }

          // Build multiplier buttons with selected state for this team
          const multiplierButtons = multiplierOptions.map((mult) => ({
            name: mult.name,
            displayName: mult.disp,
            icon: mult.icon,
            type: "multiplier" as const,
            selected: hasTeamMultiplier(team, mult.name),
          }));

          return (
            <TeamGroup
              onChangeTeams={onChangeTeams}
              multiplierOptions={multiplierButtons}
              onMultiplierToggle={(multName) =>
                toggleTeamMultiplier(team, multName)
              }
            >
              {team.rounds.map((roundToTeam) => {
                if (!roundToTeam?.$isLoaded) return null;

                const rtg = roundToTeam.roundToGame;
                if (!rtg?.$isLoaded) return null;

                const round = rtg.round;
                if (!round?.$isLoaded) return null;

                // Get player
                const player = game?.players?.$isLoaded
                  ? game.players.find(
                      (p) => p?.$isLoaded && p.$jazz.id === round.playerId,
                    )
                  : null;

                if (!player?.$isLoaded) return null;

                // Get gross score for current hole (1-indexed: "1"-"18")
                const holeNum = String(currentHoleIndex + 1);
                const gross = getGrossScore(round, holeNum);

                // Calculate pops and net only if handicaps are used
                let calculatedPops = 0;
                let net: number | null = null;

                if (useHandicaps) {
                  // Get course handicap from pre-calculated map (or stored value)
                  const courseHandicap =
                    calculatedCourseHandicaps.get(round.playerId) ?? 0;

                  const effectiveHandicap = getEffectiveHandicap(
                    courseHandicap,
                    rtg.gameHandicap,
                  );

                  // Use adjusted handicap if in "low" mode
                  const handicapForPops =
                    adjustedHandicaps?.get(round.playerId) ?? effectiveHandicap;

                  calculatedPops = calculatePops(
                    handicapForPops,
                    holeInfo.handicap,
                  );

                  // Calculate net using the calculated pops (not stored pops from score)
                  net =
                    gross !== null
                      ? calculateNetScore(gross, calculatedPops)
                      : null;
                } else {
                  // No handicaps - net equals gross
                  net = gross;
                }

                // Build junk options with selected state for this player
                const junkButtons = userJunkOptions.map((junk) => ({
                  name: junk.name,
                  displayName: junk.disp,
                  icon: junk.icon,
                  type: "junk" as const,
                  selected: hasPlayerJunk(team, round.playerId, junk.name),
                }));

                return (
                  <PlayerScoreRow
                    key={rtg.$jazz.id}
                    player={player}
                    gross={gross}
                    net={net}
                    par={holeInfo.par}
                    pops={calculatedPops}
                    junkOptions={junkButtons}
                    onScoreChange={(newGross) =>
                      onScoreChange(rtg.$jazz.id, newGross)
                    }
                    onUnscore={() => onUnscore(rtg.$jazz.id)}
                    onJunkToggle={(junkName) =>
                      togglePlayerJunk(team, round.playerId, junkName)
                    }
                    readonly={false}
                  />
                );
              })}
            </TeamGroup>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.gap(2),
  },
}));
