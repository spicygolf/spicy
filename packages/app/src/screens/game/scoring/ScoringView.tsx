import { FlatList } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Game, GameHole, Team } from "spicylib/schema";
import { ListOfTeamOptions, TeamOption } from "spicylib/schema";
import type { Scoreboard, ScoringContext } from "spicylib/scoring";
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
  HoleToolbar,
  PlayerScoreRow,
  TeamGroup,
} from "@/components/game/scoring";
import type { OptionButton } from "@/components/game/scoring/OptionsButtons";
import type { HoleInfo } from "@/hooks";
import { useOptionValue } from "@/hooks/useOptionValue";
import {
  getAllInheritedMultipliers,
  getCalculatedPlayerJunkOptions,
  getCalculatedTeamJunkOptions,
  getMultiplierOptions,
  getMultiplierValue,
  getTeamMultiplierStatus,
  getUserJunkOptions,
  hasCalculatedPlayerJunk,
  hasCalculatedTeamJunk,
  hasPlayerJunk,
  isMultiplierAvailable,
} from "./scoringUtils";

export interface ScoringViewProps {
  game: Game;
  holeInfo: HoleInfo;
  currentHole: GameHole | null;
  currentHoleIndex: number;
  scoreboard: Scoreboard | null;
  scoringContext: ScoringContext | null;
  onPrevHole: () => void;
  onNextHole: () => void;
  onScoreChange: (roundToGameId: string, newGross: number) => void;
  onUnscore: (roundToGameId: string) => void;
  onChangeTeams: () => void;
}

/**
 * Toggle a junk option for a player on a team
 * Creates the options list if it doesn't exist, then adds or removes the junk
 *
 * @param team - The team the player belongs to
 * @param allTeams - All teams on the current hole (needed for one_per_group limit)
 * @param playerId - The player toggling the junk
 * @param junkName - Name of the junk option
 * @param limit - If "one_per_group", only one player across ALL teams can have this junk
 */
function togglePlayerJunk(
  team: Team,
  allTeams: Team[],
  playerId: string,
  junkName: string,
  limit?: string,
): void {
  // Get the team's owner group to ensure new options are accessible
  const owner = team.$jazz.owner;

  // Ensure options list exists using Jazz pattern
  if (!team.$jazz.has("options")) {
    team.$jazz.set("options", ListOfTeamOptions.create([], { owner }));
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
    // If limit is "one_per_group", remove this junk from ALL teams first
    if (limit === "one_per_group") {
      // Clear from all teams on this hole, not just the current team
      for (const t of allTeams) {
        if (!t?.$isLoaded) continue;
        if (!t.$jazz.has("options")) continue;
        const teamOptions = t.options;
        if (!teamOptions?.$isLoaded) continue;

        // Iterate backwards to safely splice while iterating
        for (let i = teamOptions.length - 1; i >= 0; i--) {
          const opt = teamOptions[i];
          if (opt?.$isLoaded && opt.optionName === junkName && opt.playerId) {
            teamOptions.$jazz.splice(i, 1);
          }
        }
      }
    }

    // Add new option (toggle on)
    const newOption = TeamOption.create(
      {
        optionName: junkName,
        value: "true",
        playerId,
      },
      { owner },
    );
    options.$jazz.push(newOption);
  }
}

/**
 * Toggle a multiplier for a team
 * @param currentHoleNumber - The current hole number (e.g., "17") to store as firstHole
 */
function toggleTeamMultiplier(
  team: Team,
  multiplierName: string,
  currentHoleNumber: string,
): void {
  // Get the team's owner group to ensure new options are accessible
  const owner = team.$jazz.owner;

  if (!team.$jazz.has("options")) {
    team.$jazz.set("options", ListOfTeamOptions.create([], { owner }));
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
    const newOption = TeamOption.create(
      {
        optionName: multiplierName,
        value: "true", // Value required by schema, presence indicates active
        firstHole: currentHoleNumber, // Track which hole activated this multiplier
      },
      { owner },
    );
    options.$jazz.push(newOption);
  }
}

export function ScoringView({
  game,
  holeInfo,
  currentHole,
  currentHoleIndex,
  scoreboard,
  scoringContext,
  onPrevHole,
  onNextHole,
  onScoreChange,
  onUnscore,
  onChangeTeams,
}: ScoringViewProps) {
  // Get user-markable junk options for this game (player-scoped)
  const userJunkOptions = getUserJunkOptions(game);

  // Get calculated junk options (automatic based on scores)
  const calculatedPlayerJunkOptions = getCalculatedPlayerJunkOptions(game);
  const calculatedTeamJunkOptions = getCalculatedTeamJunkOptions(game);

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

  // Get the current hole number for scoreboard lookup
  const currentHoleNumber = String(currentHoleIndex + 1);

  // Get overall multiplier from scoreboard (all teams' multipliers combined)
  const overallMultiplier =
    scoreboard?.holes?.[currentHoleNumber]?.holeMultiplier ?? 1;

  // Get all teams for the current hole (needed for one_per_group junk limit)
  const allTeams: Team[] = currentHole?.teams?.$isLoaded
    ? ([...currentHole.teams].filter((t) => t?.$isLoaded) as Team[])
    : [];

  return (
    <>
      <HoleHeader hole={holeInfo} onPrevious={onPrevHole} onNext={onNextHole} />
      <HoleToolbar
        onChangeTeams={onChangeTeams}
        overallMultiplier={overallMultiplier}
      />
      <FlatList
        style={styles.content}
        data={allTeams}
        keyExtractor={(team, index) => team?.$jazz.id ?? String(index)}
        renderItem={({ item: team }) => {
          if (!team?.$isLoaded) return null;
          if (!team.$jazz.has("rounds") || !team.rounds?.$isLoaded) {
            return null;
          }

          const teamId = team.team ?? "";

          // Build multiplier buttons
          // For stackable multipliers (rest_of_nine scope like pre_double):
          // 1. Show disabled filled button for each inherited instance from previous holes
          // 2. Show clickable button if active on this hole (can toggle off)
          // 3. Show clickable button if availability allows adding a new one
          const gameHoles = scoringContext?.gameHoles ?? [];

          const multiplierButtons: OptionButton[] = [];

          for (const mult of multiplierOptions) {
            const status = getTeamMultiplierStatus(
              team,
              mult.name,
              currentHoleNumber,
            );
            const inheritedInstances = getAllInheritedMultipliers(
              mult,
              teamId,
              currentHoleNumber,
              gameHoles,
            );
            const multiplierValue = getMultiplierValue(mult, gameHoles);

            // 1. Add disabled filled buttons for inherited instances
            for (const inherited of inheritedInstances) {
              multiplierButtons.push({
                name: `${mult.name}_inherited_${inherited.firstHole}`,
                displayName: mult.disp,
                icon: mult.icon,
                type: "multiplier" as const,
                selected: true,
                inherited: true, // This makes it disabled
                points: inherited.value,
              });
            }

            // 2. If active on THIS hole, show clickable selected button
            if (status.active) {
              multiplierButtons.push({
                name: mult.name,
                displayName: mult.disp,
                icon: mult.icon,
                type: "multiplier" as const,
                selected: true,
                inherited: false,
                points: multiplierValue,
              });
            } else {
              // 3. If availability allows, show clickable unselected button
              const isAvailable = isMultiplierAvailable(
                mult,
                scoringContext,
                currentHoleNumber,
                teamId,
              );

              if (isAvailable) {
                multiplierButtons.push({
                  name: mult.name,
                  displayName: mult.disp,
                  icon: mult.icon,
                  type: "multiplier" as const,
                  selected: false,
                  inherited: false,
                  points: multiplierValue,
                });
              }
            }
          }

          // Build calculated team junk buttons (low_ball, low_total)
          // Only show if the team has actually earned this junk (hide unachieved)
          const teamJunkButtons: OptionButton[] = calculatedTeamJunkOptions
            .filter((junk) =>
              hasCalculatedTeamJunk(
                scoreboard,
                currentHoleNumber,
                teamId,
                junk.name,
              ),
            )
            .map((junk) => ({
              name: junk.name,
              displayName: junk.disp,
              icon: junk.icon,
              type: "junk" as const,
              selected: true, // Always selected since we filter to only achieved
              points: junk.value,
              calculated: true, // Mark as calculated/automatic
            }));

          // Get team result from scoreboard for this hole
          const teamHoleResult =
            scoreboard?.holes?.[currentHoleNumber]?.teams?.[teamId];

          // For 2-team games, derive display junk from holeNetTotal
          // holeNetTotal = (myJunk - oppJunk) × multiplier
          // So displayJunk = holeNetTotal / multiplier (clamped to 0 for losing team)
          const holeNetTotal = teamHoleResult?.holeNetTotal ?? 0;
          const displayJunk =
            overallMultiplier > 0
              ? Math.max(0, Math.round(holeNetTotal / overallMultiplier))
              : 0;
          const displayPoints = Math.max(0, holeNetTotal);

          // Build earned multipliers from scoreboard (automatic multipliers like birdie_bbq)
          // These are multipliers that were automatically awarded based on junk conditions
          // Exclude user-activated multipliers (already in multiplierButtons)
          // Note: inherited buttons have names like "pre_double_inherited_1", so we need to
          // extract the base multiplier name for filtering
          const userMultiplierNames = new Set(
            multiplierButtons.map((m) => {
              // Extract base name from inherited buttons (e.g., "pre_double_inherited_1" -> "pre_double")
              const inheritedMatch = m.name.match(/^(.+)_inherited_\d+$/);
              return inheritedMatch ? inheritedMatch[1] : m.name;
            }),
          );
          // Get spec options for looking up display names of automatic multipliers
          const spec = game?.specs?.$isLoaded ? game.specs[0] : null;
          const specOptions = spec?.$isLoaded ? spec.options : null;
          const earnedMultiplierButtons: OptionButton[] = (
            teamHoleResult?.multipliers ?? []
          )
            .filter((m) => !userMultiplierNames.has(m.name))
            .map((m) => {
              // Look up the option definition from the spec for display name and icon
              const optDefRaw = specOptions?.$isLoaded
                ? specOptions[m.name]
                : null;
              const optDef = optDefRaw?.$isLoaded ? optDefRaw : null;
              // Icon is only on multiplier/junk options, not game options
              const icon =
                optDef?.type === "multiplier" || optDef?.type === "junk"
                  ? optDef.icon
                  : undefined;
              return {
                name: m.name,
                displayName: optDef?.disp ?? m.name,
                icon,
                type: "multiplier" as const,
                selected: true,
                earned: true, // Mark as earned/automatic
                points: m.value, // Use points field to show multiplier value (e.g., 2 for 2x)
              };
            });

          return (
            <TeamGroup
              multiplierOptions={multiplierButtons}
              earnedMultipliers={earnedMultiplierButtons}
              teamJunkOptions={teamJunkButtons}
              onMultiplierToggle={(multName) =>
                toggleTeamMultiplier(team, multName, currentHoleNumber)
              }
              junkTotal={displayJunk}
              holeMultiplier={overallMultiplier}
              holePoints={displayPoints}
              runningDiff={teamHoleResult?.runningDiff ?? 0}
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

                // Build user-markable junk options with selected state for this player
                const userJunkButtons: OptionButton[] = userJunkOptions.map(
                  (junk) => ({
                    name: junk.name,
                    displayName: junk.disp,
                    icon: junk.icon,
                    type: "junk" as const,
                    selected: hasPlayerJunk(team, round.playerId, junk.name),
                    points: junk.value,
                    calculated: false, // User-toggleable
                  }),
                );

                // Build calculated junk options (birdie, eagle) from scoreboard
                // Only include junk that was actually achieved (hide unachieved)
                const calculatedJunkButtons: OptionButton[] =
                  calculatedPlayerJunkOptions
                    .filter((junk) =>
                      hasCalculatedPlayerJunk(
                        scoreboard,
                        holeNum,
                        round.playerId,
                        junk.name,
                      ),
                    )
                    .map((junk) => ({
                      name: junk.name,
                      displayName: junk.disp,
                      icon: junk.icon,
                      type: "junk" as const,
                      selected: true, // Always selected since we filter to only achieved
                      points: junk.value,
                      calculated: true, // Automatic, not toggleable
                    }));

                // Combine: user junk first (prox), then calculated/awarded (birdie, eagle)
                const junkButtons = [
                  ...userJunkButtons,
                  ...calculatedJunkButtons,
                ];

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
                    onJunkToggle={(junkName) => {
                      const junkOption = userJunkOptions.find(
                        (j) => j.name === junkName,
                      );
                      togglePlayerJunk(
                        team,
                        allTeams,
                        round.playerId,
                        junkName,
                        junkOption?.limit ?? undefined,
                      );
                    }}
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
