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
import type {
  Scoreboard,
  ScoringContext,
  TeamHoleResult,
} from "spicylib/scoring";
import { evaluateAvailability } from "spicylib/scoring";
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
import { useScoreboard } from "@/hooks/useScoreboard";

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
 * Get calculated (automatic) junk options from game spec
 * These are player-scoped junk options with based_on: "gross", "net", or logic-based
 * Examples: birdie, eagle (based on score_to_par)
 */
function getCalculatedPlayerJunkOptions(game: Game): JunkOption[] {
  const junkOptions: JunkOption[] = [];

  const spec = game.specs?.$isLoaded ? game.specs[0] : null;
  if (!spec?.$isLoaded) return junkOptions;

  const options = spec.options;
  if (!options?.$isLoaded) return junkOptions;

  for (const key of Object.keys(options)) {
    const opt = options[key];
    if (
      opt?.$isLoaded &&
      opt.type === "junk" &&
      opt.scope === "player" &&
      opt.based_on !== "user" && // Not user-marked
      (opt.show_in === "score" || opt.show_in === "faves")
    ) {
      junkOptions.push(opt);
    }
  }

  junkOptions.sort((a, b) => (a.seq ?? 999) - (b.seq ?? 999));
  return junkOptions;
}

/**
 * Get calculated (automatic) team junk options from game spec
 * These are team-scoped junk options with calculation: "best_ball", "sum", etc.
 * Examples: low_ball, low_total
 *
 * Note: We don't filter by show_in here because the scoring engine awards
 * these based on calculation, and they should be shown if earned.
 * The show_in field may not be set on older data.
 */
function getCalculatedTeamJunkOptions(game: Game): JunkOption[] {
  const junkOptions: JunkOption[] = [];

  const spec = game.specs?.$isLoaded ? game.specs[0] : null;
  if (!spec?.$isLoaded) return junkOptions;

  const options = spec.options;
  if (!options?.$isLoaded) return junkOptions;

  for (const key of Object.keys(options)) {
    const opt = options[key];
    if (
      opt?.$isLoaded &&
      opt.type === "junk" &&
      opt.scope === "team" &&
      opt.calculation && // Has a calculation method (best_ball, sum, etc.)
      opt.show_in !== "none" // Only exclude if explicitly hidden
    ) {
      junkOptions.push(opt);
    }
  }

  junkOptions.sort((a, b) => (a.seq ?? 999) - (b.seq ?? 999));
  return junkOptions;
}

/**
 * Check if a player has calculated junk from the scoreboard
 */
function hasCalculatedPlayerJunk(
  scoreboard: Scoreboard | null,
  holeNum: string,
  playerId: string,
  junkName: string,
): boolean {
  if (!scoreboard) return false;

  const holeResult = scoreboard.holes[holeNum];
  if (!holeResult) return false;

  const playerResult = holeResult.players[playerId];
  if (!playerResult) return false;

  return playerResult.junk.some((j) => j.name === junkName);
}

/**
 * Check if a team has calculated junk from the scoreboard
 */
function hasCalculatedTeamJunk(
  scoreboard: Scoreboard | null,
  holeNum: string,
  teamId: string,
  junkName: string,
): boolean {
  if (!scoreboard) return false;

  const holeResult = scoreboard.holes[holeNum];
  if (!holeResult) return false;

  const teamResult = holeResult.teams[teamId];
  if (!teamResult) return false;

  return teamResult.junk.some((j) => j.name === junkName);
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
 *
 * @param limit - If "one_per_group", only one player in the team can have this junk
 */
function togglePlayerJunk(
  team: Team,
  playerId: string,
  junkName: string,
  limit?: string,
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
    // If limit is "one_per_group", remove this junk from all other players first
    if (limit === "one_per_group") {
      // Find and remove all existing options for this junk (from other players)
      // Iterate backwards to safely splice while iterating
      for (let i = options.length - 1; i >= 0; i--) {
        const opt = options[i];
        if (opt?.$isLoaded && opt.optionName === junkName) {
          options.$jazz.splice(i, 1);
        }
      }
    }

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
 * Check if a multiplier is available for a team based on its availability condition.
 * Uses the scoring engine's evaluateAvailability function to evaluate JSON Logic.
 *
 * If the multiplier has no availability condition, it's always available.
 * If the context is not available, we can't evaluate so we return true (show it).
 */
function isMultiplierAvailable(
  mult: MultiplierOption,
  ctx: ScoringContext | null,
  holeNum: string,
  teamId: string,
): boolean {
  // If no availability condition, always available
  if (!mult.availability) return true;

  // If no context, can't evaluate - show the multiplier
  if (!ctx) return true;

  const scoreboard = ctx.scoreboard;
  if (!scoreboard) return true;

  const holeResult = scoreboard.holes[holeNum];
  if (!holeResult) return true;

  const teamResult = holeResult.teams[teamId];
  if (!teamResult) return true;

  try {
    return evaluateAvailability(
      mult.availability,
      teamResult as TeamHoleResult,
      holeResult,
      ctx,
    );
  } catch {
    // If evaluation fails, show the multiplier
    return true;
  }
}

/**
 * Result of checking team multiplier status
 */
interface MultiplierStatus {
  /** Whether the multiplier is active */
  active: boolean;
  /** The hole number where this multiplier was first activated (e.g., "17") */
  firstHole?: string;
}

/**
 * Check if a team has a specific multiplier active on this hole
 * Returns both whether it's active and which hole it was first activated on
 */
function getTeamMultiplierStatus(
  team: Team,
  multiplierName: string,
): MultiplierStatus {
  if (!team.options?.$isLoaded) return { active: false };

  for (const opt of team.options) {
    if (
      opt?.$isLoaded &&
      opt.optionName === multiplierName &&
      !opt.playerId // Team-level (no player)
    ) {
      return {
        active: true,
        firstHole: opt.firstHole,
      };
    }
  }
  return { active: false };
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
      firstHole: currentHoleNumber, // Track which hole activated this multiplier
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
  // Get the scoreboard and context from the scoring engine (memoized)
  const scoreResult = useScoreboard(game);
  const scoreboard = scoreResult?.scoreboard ?? null;
  const scoringContext = scoreResult?.context ?? null;

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

  return (
    <>
      <HoleHeader hole={holeInfo} onPrevious={onPrevHole} onNext={onNextHole} />
      <HoleToolbar
        onChangeTeams={onChangeTeams}
        overallMultiplier={overallMultiplier}
      />
      <FlatList
        style={styles.content}
        data={currentHole?.teams?.$isLoaded ? [...currentHole.teams] : []}
        keyExtractor={(team) => team?.$jazz.id ?? "unknown"}
        renderItem={({ item: team }) => {
          if (!team?.$isLoaded || !team.rounds?.$isLoaded) {
            return null;
          }

          // Current hole number for tracking firstHole on new multipliers
          const currentHoleNumber = String(currentHoleIndex + 1);
          const teamId = team.team ?? "";

          // Build multiplier buttons - only include available multipliers or already active ones
          const multiplierButtons: OptionButton[] = multiplierOptions
            .filter((mult) => {
              const status = getTeamMultiplierStatus(team, mult.name);
              // Always show if already active (selected or inherited)
              if (status.active) return true;
              // Otherwise, check availability condition
              return isMultiplierAvailable(
                mult,
                scoringContext,
                currentHoleNumber,
                teamId,
              );
            })
            .map((mult) => {
              const status = getTeamMultiplierStatus(team, mult.name);
              // Inherited if active and firstHole is set but different from current hole
              const isInherited =
                status.active &&
                status.firstHole !== undefined &&
                status.firstHole !== currentHoleNumber;

              return {
                name: mult.name,
                displayName: mult.disp,
                icon: mult.icon,
                type: "multiplier" as const,
                selected: status.active,
                inherited: isInherited,
              };
            });

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
          const holeResult = scoreboard?.holes?.[currentHoleNumber];

          // Calculate junk total (team junk + player junk for players on this team)
          const teamJunkTotal =
            teamHoleResult?.junk.reduce((sum, j) => sum + j.value, 0) ?? 0;
          let playerJunkTotal = 0;
          if (teamHoleResult?.playerIds && holeResult?.players) {
            for (const playerId of teamHoleResult.playerIds) {
              const playerResult = holeResult.players[playerId];
              if (playerResult?.junk) {
                playerJunkTotal += playerResult.junk.reduce(
                  (sum, j) => sum + j.value,
                  0,
                );
              }
            }
          }
          const junkTotal = teamJunkTotal + playerJunkTotal;

          // Build earned multipliers from scoreboard (automatic multipliers like birdie_bbq)
          // These are multipliers that were automatically awarded based on junk conditions
          // Exclude user-activated multipliers (already in multiplierButtons)
          const userMultiplierNames = new Set(
            multiplierButtons.map((m) => m.name),
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
              junkTotal={junkTotal}
              holeMultiplier={overallMultiplier}
              holePoints={teamHoleResult?.points ?? 0}
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
