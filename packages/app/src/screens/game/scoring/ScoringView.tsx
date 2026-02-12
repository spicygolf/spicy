import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Game, GameHole, MultiplierOption, Team } from "spicylib/schema";
import { ListOfTeamOptions, TeamOption } from "spicylib/schema";
import type { Scoreboard, ScoringContext } from "spicylib/scoring";
import {
  getHoleTeeMultiplierTotalWithOverride,
  getTeamHolePoints,
  getTeamRunningScore,
  isHoleComplete,
} from "spicylib/scoring";
import {
  adjustHandicapsToLow,
  calculateCourseHandicap,
  calculateNetScore,
  calculatePops,
  getEffectiveHandicap,
  getGrossScore,
} from "spicylib/utils";
import {
  CustomMultiplierModal,
  HoleHeader,
  HoleToolbar,
  PlayerScoreRow,
  TeamGroup,
  TeeFlipConfirmModal,
  TeeFlipModal,
} from "@/components/game/scoring";
import type { OptionButton } from "@/components/game/scoring/OptionsButtons";
import type { HoleInfo } from "@/hooks";
import { useOptionValue } from "@/hooks/useOptionValue";
import {
  getAllInheritedMultipliers,
  getCalculatedPlayerJunkOptions,
  getCalculatedTeamJunkOptions,
  getCustomMultiplierOption,
  getCustomMultiplierState,
  getMultiplierOptions,
  getMultiplierValue,
  getTeamMultiplierStatus,
  getTeeFlipDeclined,
  getTeeFlipWinner,
  getUserJunkOptions,
  hasCalculatedPlayerJunk,
  hasCalculatedTeamJunk,
  hasPlayerJunk,
  isEarliestUnflippedHole,
  isMultiplierAvailable,
  isTeeFlipRequired,
} from "./scoringUtils";

export interface ScoringViewProps {
  game: Game;
  holeInfo: HoleInfo;
  currentHole: GameHole | null;
  currentHoleIndex: number;
  /** Ordered list of hole number strings from useHoleNavigation */
  holesList: string[];
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
 * Remove all hole-scoped team multipliers from all teams on the current hole.
 *
 * Used when setting a custom (override) multiplier to clear doubles/double_backs
 * that would otherwise cause visual confusion (scoring already replaces them).
 *
 * @param allTeams - All teams on the current hole
 * @param multiplierOptions - Multiplier option definitions (filtered to team-scoped)
 * @param currentHoleNumber - Current hole number
 */
function removeHoleScopedMultipliers(
  allTeams: Team[],
  multiplierOptions: MultiplierOption[],
  currentHoleNumber: string,
): void {
  for (const team of allTeams) {
    if (!team?.$isLoaded) continue;
    if (!team.options?.$isLoaded) continue;
    for (let i = team.options.length - 1; i >= 0; i--) {
      const opt = team.options[i];
      if (!opt?.$isLoaded) continue;
      const multDef = multiplierOptions.find((m) => m.name === opt.optionName);
      if (
        multDef &&
        multDef.scope === "hole" &&
        opt.firstHole === currentHoleNumber &&
        !opt.playerId
      ) {
        team.options.$jazz.splice(i, 1);
      }
    }
  }
}

/**
 * Remove dependent multipliers from other teams when a foundation multiplier is removed.
 *
 * Finds multipliers whose availability uses `other_team_multiplied_with` referencing
 * the removed multiplier, then removes those from other teams on the current hole.
 * Example: removing "double" cascades to remove "double_back" from the opposing team.
 *
 * @param removedMultName - The multiplier being removed (e.g., "double")
 * @param removingTeamId - The team removing the multiplier
 * @param allTeams - All teams on the current hole
 * @param multiplierOptions - All multiplier option definitions
 * @param currentHoleNumber - Current hole number
 */
function removeDependentMultipliers(
  removedMultName: string,
  removingTeamId: string,
  allTeams: Team[],
  multiplierOptions: MultiplierOption[],
  currentHoleNumber: string,
): void {
  // Find multipliers whose availability depends on the removed multiplier.
  // NOTE: This uses heuristic string matching on JSON Logic expressions.
  // If the availability expression format changes (e.g., different quoting,
  // nested references, or multiplier names that are substrings of others),
  // this may need to be replaced with proper JSON parsing.
  const dependentMults = multiplierOptions.filter((m) => {
    if (!m.availability) return false;
    return (
      m.availability.includes("other_team_multiplied_with") &&
      (m.availability.includes(`'${removedMultName}'`) ||
        m.availability.includes(`"${removedMultName}"`))
    );
  });

  // Remove those from OTHER teams (not the team that removed the original)
  for (const depMult of dependentMults) {
    for (const team of allTeams) {
      if (!team?.$isLoaded || team.team === removingTeamId) continue;
      if (!team.options?.$isLoaded) continue;
      for (let i = team.options.length - 1; i >= 0; i--) {
        const opt = team.options[i];
        if (
          opt?.$isLoaded &&
          opt.optionName === depMult.name &&
          opt.firstHole === currentHoleNumber &&
          !opt.playerId
        ) {
          team.options.$jazz.splice(i, 1);
        }
      }
    }
  }
}

/**
 * Toggle a multiplier for a team.
 *
 * When removing a multiplier, also cascade-deletes dependent multipliers from other teams
 * (e.g., removing "double" also removes "double_back" from the opposing team).
 *
 * @param team - The team toggling the multiplier
 * @param multiplierName - The multiplier option name
 * @param currentHoleNumber - The current hole number (e.g., "17") to store as firstHole
 * @param allTeams - All teams on the current hole (for cascade delete)
 * @param multiplierOptions - All multiplier option definitions (for cascade delete)
 */
function toggleTeamMultiplier(
  team: Team,
  multiplierName: string,
  currentHoleNumber: string,
  allTeams: Team[],
  multiplierOptions: MultiplierOption[],
): void {
  // Get the team's owner group to ensure new options are accessible
  const owner = team.$jazz.owner;

  if (!team.$jazz.has("options")) {
    team.$jazz.set("options", ListOfTeamOptions.create([], { owner }));
  }

  const options = team.options;
  if (!options?.$isLoaded) return;

  // Find existing team-level option for THIS hole
  let existingIndex = -1;
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    if (
      opt?.$isLoaded &&
      opt.optionName === multiplierName &&
      opt.firstHole === currentHoleNumber &&
      !opt.playerId // Team-level
    ) {
      existingIndex = i;
      break;
    }
  }

  if (existingIndex >= 0) {
    options.$jazz.splice(existingIndex, 1);
    // Cascade: remove dependent multipliers from other teams
    removeDependentMultipliers(
      multiplierName,
      team.team ?? "",
      allTeams,
      multiplierOptions,
      currentHoleNumber,
    );
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

/**
 * Set a custom multiplier for a team
 * @param team - The team to set the multiplier on
 * @param multiplierName - The multiplier option name (e.g., "custom")
 * @param currentHoleNumber - The current hole number
 * @param value - The multiplier value to set
 */
function setCustomMultiplier(
  team: Team,
  multiplierName: string,
  currentHoleNumber: string,
  value: number,
): void {
  const owner = team.$jazz.owner;

  if (!team.$jazz.has("options")) {
    team.$jazz.set("options", ListOfTeamOptions.create([], { owner }));
  }

  const options = team.options;
  if (!options?.$isLoaded) return;

  // Remove any existing custom multiplier for this hole first
  for (let i = options.length - 1; i >= 0; i--) {
    const opt = options[i];
    if (
      opt?.$isLoaded &&
      opt.optionName === multiplierName &&
      opt.firstHole === currentHoleNumber &&
      !opt.playerId
    ) {
      options.$jazz.splice(i, 1);
    }
  }

  // Add new custom multiplier with the value
  const newOption = TeamOption.create(
    {
      optionName: multiplierName,
      value: String(value), // Store the multiplier value as string
      firstHole: currentHoleNumber,
    },
    { owner },
  );
  options.$jazz.push(newOption);
}

/**
 * Clear a custom multiplier from a team
 */
function clearCustomMultiplier(
  team: Team,
  multiplierName: string,
  currentHoleNumber: string,
): void {
  if (!team.options?.$isLoaded) return;

  const options = team.options;
  for (let i = options.length - 1; i >= 0; i--) {
    const opt = options[i];
    if (
      opt?.$isLoaded &&
      opt.optionName === multiplierName &&
      opt.firstHole === currentHoleNumber &&
      !opt.playerId
    ) {
      options.$jazz.splice(i, 1);
    }
  }
}

/**
 * Record the tee flip winner by storing a TeamOption on the winning team.
 *
 * @param team - The team that won the tee flip
 * @param currentHoleNumber - The hole number to record the result for
 */
function recordTeeFlipWinner(team: Team, currentHoleNumber: string): void {
  const owner = team.$jazz.owner;

  if (!team.$jazz.has("options")) {
    team.$jazz.set("options", ListOfTeamOptions.create([], { owner }));
  }

  const options = team.options;
  if (!options?.$isLoaded) return;

  // Guard against duplicate entries for the same hole
  for (const opt of options) {
    if (
      opt?.$isLoaded &&
      opt.optionName === "tee_flip_winner" &&
      opt.firstHole === currentHoleNumber
    ) {
      return;
    }
  }

  const newOption = TeamOption.create(
    {
      optionName: "tee_flip_winner",
      value: "true",
      firstHole: currentHoleNumber,
    },
    { owner },
  );
  options.$jazz.push(newOption);
}

/**
 * Record that the tee flip was declined by storing a TeamOption on the first team.
 *
 * @param team - The team to store the declined option on (any team works, typically first)
 * @param currentHoleNumber - The hole number to record the decline for
 */
function recordTeeFlipDeclined(team: Team, currentHoleNumber: string): void {
  const owner = team.$jazz.owner;

  if (!team.$jazz.has("options")) {
    team.$jazz.set("options", ListOfTeamOptions.create([], { owner }));
  }

  const options = team.options;
  if (!options?.$isLoaded) return;

  // Guard against duplicate entries for the same hole
  for (const opt of options) {
    if (
      opt?.$isLoaded &&
      opt.optionName === "tee_flip_declined" &&
      opt.firstHole === currentHoleNumber
    ) {
      return;
    }
  }

  const newOption = TeamOption.create(
    {
      optionName: "tee_flip_declined",
      value: "true",
      firstHole: currentHoleNumber,
    },
    { owner },
  );
  options.$jazz.push(newOption);
}

export function ScoringView({
  game,
  holeInfo,
  currentHole,
  currentHoleIndex,
  holesList,
  scoreboard,
  scoringContext,
  onPrevHole,
  onNextHole,
  onScoreChange,
  onUnscore,
  onChangeTeams,
}: ScoringViewProps): React.ReactElement {
  // Modal state for custom multiplier
  const [customMultiplierModalVisible, setCustomMultiplierModalVisible] =
    useState(false);

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

  // Get max_off_tee cap for the custom multiplier modal
  const maxOffTeeValue = useOptionValue(
    game,
    currentHole,
    "max_off_tee",
    "game",
  );
  const maxOffTeeParsed =
    maxOffTeeValue !== undefined ? Number.parseInt(maxOffTeeValue, 10) : null;
  const maxOffTee =
    maxOffTeeParsed !== null && !Number.isNaN(maxOffTeeParsed)
      ? maxOffTeeParsed
      : null;

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

  // Get current hole result from scoreboard
  const currentHoleResult = scoreboard?.holes?.[currentHoleNumber];

  // Get tee multiplier (unearned/user-activated multipliers only, excludes birdie_bbq etc.)
  // This is what shows in the HoleToolbar - what teams committed to "off the tee"
  // Uses override-aware logic so custom/twelve replace rather than stack with other multipliers
  const teeMultiplier = getHoleTeeMultiplierTotalWithOverride(
    currentHoleResult ?? null,
  );

  // Get overall multiplier from scoreboard (all teams' multipliers combined, including earned)
  // This is used for calculating display points
  const overallMultiplier = currentHoleResult?.holeMultiplier ?? 1;

  // Warnings and completeness come from the scoring engine
  const warnings = currentHoleResult?.warnings;
  const holeComplete = isHoleComplete(currentHoleResult);

  // Get all teams for the current hole (needed for one_per_group junk limit)
  const allTeams: Team[] = currentHole?.teams?.$isLoaded
    ? ([...currentHole.teams].filter((t) => t?.$isLoaded) as Team[])
    : [];

  // Get custom multiplier option and state
  const customMultiplierOption = getCustomMultiplierOption(multiplierOptions);
  const customMultiplierState = getCustomMultiplierState(
    multiplierOptions,
    allTeams,
    currentHoleNumber,
  );

  // Filter out scope:"none" multipliers from the regular multiplier options
  // (they are handled separately via the hole toolbar)
  const teamMultiplierOptions = multiplierOptions.filter(
    (m) => m.scope !== "none",
  );

  // All game holes (used for override detection, tee flip scanning, and multiplier display)
  const gameHoles = scoringContext?.gameHoles ?? [];

  // Check if ANY team on this hole has an override multiplier active (excluding custom which is handled separately)
  // If so, we hide all multiplier buttons for ALL teams (only the override owner can toggle it off)
  let holeHasActiveOverride = false;
  let overrideOwnerTeamId: string | null = null;
  let activeOverrideMult: (typeof teamMultiplierOptions)[0] | null = null;
  let activeOverrideValue = 0;

  for (const mult of teamMultiplierOptions) {
    if (mult.override) {
      for (const team of allTeams) {
        const status = getTeamMultiplierStatus(
          team,
          mult.name,
          currentHoleNumber,
        );
        if (status.active) {
          holeHasActiveOverride = true;
          overrideOwnerTeamId = team.team ?? null;
          activeOverrideMult = mult;
          activeOverrideValue = getMultiplierValue(mult, gameHoles);
          break;
        }
      }
      if (holeHasActiveOverride) break;
    }
  }

  // --- Tee Flip Logic ---
  // Determines if a tee flip is needed (2-team game, tied going into this hole)
  // and reads/stores the result as a TeamOption.

  // Read the tee_flip option to determine if enabled and get the label text
  const teeFlipOptionValue = useOptionValue(
    game,
    currentHole,
    "tee_flip",
    "game",
  );
  const teeFlipEnabled = !!teeFlipOptionValue;
  const teeFlipLabel = teeFlipOptionValue ?? "";

  const teeFlipRequired = isTeeFlipRequired(
    scoreboard,
    currentHoleIndex,
    holesList,
    allTeams.length,
    teamMultiplierOptions.length > 0,
  );

  const teeFlipWinner = getTeeFlipWinner(allTeams, currentHoleNumber);
  const teeFlipDeclined = getTeeFlipDeclined(allTeams, currentHoleNumber);

  const earliestUnflipped =
    teeFlipEnabled &&
    teeFlipRequired &&
    !teeFlipWinner &&
    !teeFlipDeclined &&
    isEarliestUnflippedHole(
      scoreboard,
      holesList,
      currentHoleIndex,
      allTeams,
      allTeams.length,
      teamMultiplierOptions.length > 0,
      gameHoles,
    );

  // Stabilize teamIds so TeeFlipModal's useMemo doesn't re-roll on every render
  const team1Id = allTeams[0]?.team ?? "1";
  const team2Id = allTeams[1]?.team ?? "2";
  const teeFlipTeamIds = useMemo(
    (): [string, string] => [team1Id, team2Id],
    [team1Id, team2Id],
  );

  // Modal state: "confirm" = asking user, "flip" = random first flip, "replay" = replay previous result
  const [teeFlipMode, setTeeFlipMode] = useState<
    "confirm" | "flip" | "replay" | null
  >(null);

  // Reset modal when navigating to a different hole
  useEffect(() => {
    setTeeFlipMode(null);
  }, [currentHoleIndex]);

  // Show confirmation modal when this is the earliest unflipped hole
  useEffect(() => {
    if (earliestUnflipped && allTeams.length === 2) {
      setTeeFlipMode("confirm");
    }
  }, [earliestUnflipped, allTeams.length]);

  const handleTeeFlipComplete = useCallback(
    (winnerTeamId: string) => {
      if (teeFlipMode === "flip") {
        const winnerTeam = allTeams.find((t) => t.team === winnerTeamId);
        if (winnerTeam) {
          recordTeeFlipWinner(winnerTeam, currentHoleNumber);
        }
      }
      setTeeFlipMode(null);
    },
    [teeFlipMode, allTeams, currentHoleNumber],
  );

  // Handler for setting custom multiplier
  const handleSetCustomMultiplier = (value: number): void => {
    if (!customMultiplierOption) return;

    // Custom multiplier applies to the whole hole (override), so it doesn't matter
    // which team "owns" it - just use the first team as a storage location
    const targetTeam = allTeams[0];
    if (!targetTeam) return;

    setCustomMultiplier(
      targetTeam,
      customMultiplierOption.name,
      currentHoleNumber,
      value,
    );

    // Clean up hole-scoped multipliers from all teams (double, double_back).
    // Custom is override=true so these are replaced in scoring anyway,
    // and removing them avoids visual confusion.
    removeHoleScopedMultipliers(
      allTeams,
      teamMultiplierOptions,
      currentHoleNumber,
    );
  };

  // Handler for clearing custom multiplier
  const handleClearCustomMultiplier = (): void => {
    if (!customMultiplierOption || !customMultiplierState.ownerTeamId) return;

    const ownerTeam = allTeams.find(
      (t) => t.team === customMultiplierState.ownerTeamId,
    );
    if (!ownerTeam) return;

    clearCustomMultiplier(
      ownerTeam,
      customMultiplierOption.name,
      currentHoleNumber,
    );
  };

  return (
    <>
      <HoleHeader
        hole={holeInfo}
        onPrevious={onPrevHole}
        onNext={onNextHole}
        warnings={warnings}
      />
      <HoleToolbar
        onChangeTeams={onChangeTeams}
        overallMultiplier={teeMultiplier}
        isCustomMultiplier={customMultiplierState.isActive}
        onMultiplierPress={
          customMultiplierOption
            ? () => setCustomMultiplierModalVisible(true)
            : undefined
        }
      />
      <CustomMultiplierModal
        visible={customMultiplierModalVisible}
        currentValue={
          customMultiplierState.isActive ? customMultiplierState.value : null
        }
        maxValue={maxOffTee}
        onSet={handleSetCustomMultiplier}
        onClear={handleClearCustomMultiplier}
        onClose={() => setCustomMultiplierModalVisible(false)}
      />
      {allTeams.length === 2 && (
        <>
          <TeeFlipConfirmModal
            visible={teeFlipMode === "confirm"}
            label={teeFlipLabel}
            onConfirm={() => setTeeFlipMode("flip")}
            onDecline={() => {
              const storageTeam = allTeams[0];
              if (storageTeam) {
                recordTeeFlipDeclined(storageTeam, currentHoleNumber);
              }
              setTeeFlipMode(null);
            }}
          />
          <TeeFlipModal
            visible={teeFlipMode === "flip" || teeFlipMode === "replay"}
            teamIds={teeFlipTeamIds}
            predeterminedWinner={
              teeFlipMode === "replay"
                ? (teeFlipWinner ?? undefined)
                : undefined
            }
            onFlipComplete={handleTeeFlipComplete}
          />
        </>
      )}
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
          //
          // Special case: If an override multiplier is active on this hole (ANY team),
          // hide all multiplier buttons except for the override owner who can toggle it off.
          // Also hide buttons when custom multiplier is active (it's set via hole toolbar, not team buttons).
          const multiplierButtons: OptionButton[] = [];

          // If tee flip is required and not declined, only the winning team sees multiplier buttons
          // When declined, both teams get multiplier buttons (no blocking)
          const teeFlipBlocksTeam =
            teeFlipEnabled &&
            teeFlipRequired &&
            !teeFlipDeclined &&
            (!teeFlipWinner || teeFlipWinner !== teamId);

          if (
            !teeFlipBlocksTeam &&
            holeHasActiveOverride &&
            activeOverrideMult
          ) {
            // Only show the override button on the team that owns it
            if (teamId === overrideOwnerTeamId) {
              multiplierButtons.push({
                name: activeOverrideMult.name,
                displayName: activeOverrideMult.disp,
                icon: activeOverrideMult.icon,
                type: "multiplier" as const,
                selected: true,
                inherited: false,
                points: activeOverrideValue,
              });
            }
            // Other teams show nothing
          } else if (!teeFlipBlocksTeam && !customMultiplierState.isActive) {
            // Normal case: build all multiplier buttons (but not when custom multiplier is active)
            for (const mult of teamMultiplierOptions) {
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
                  name: `${mult.name}_inherited_${teamId}_${inherited.firstHole}`,
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
                // For dynamic multipliers (value_from), append the value to the display name
                const displayName = mult.value_from
                  ? `${mult.disp} ${multiplierValue}x`
                  : mult.disp;

                multiplierButtons.push({
                  name: mult.name,
                  displayName,
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
                  // For dynamic multipliers (value_from), append the value to the display name
                  const displayName = mult.value_from
                    ? `${mult.disp} ${multiplierValue}x`
                    : mult.disp;

                  multiplierButtons.push({
                    name: mult.name,
                    displayName,
                    icon: mult.icon,
                    type: "multiplier" as const,
                    selected: false,
                    inherited: false,
                    points: multiplierValue,
                  });
                }
              }
            }
          }

          // Build calculated team junk buttons (low_ball, low_total)
          // Only show if the hole is complete AND the team has earned this junk
          const teamJunkButtons: OptionButton[] = holeComplete
            ? calculatedTeamJunkOptions
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
                  ownerId: teamId, // For testID: junk-{name}-{teamId}
                }))
            : [];

          // Get team result from scoreboard for this hole
          const teamHoleResult =
            scoreboard?.holes?.[currentHoleNumber]?.teams?.[teamId];

          // Get effective hole points: holeNetTotal for 2-team games (net vs
          // opponent), absolute points for individual/multi-team games.
          // Only show scoring when hole is complete (all scores + required junk entered)
          const holePoints = getTeamHolePoints(teamHoleResult);
          const displayJunk = holeComplete
            ? overallMultiplier > 0
              ? Math.max(0, Math.round(holePoints / overallMultiplier))
              : 0
            : 0;
          const displayPoints = holeComplete ? Math.max(0, holePoints) : 0;

          // Build earned multipliers from scoreboard (automatic multipliers like birdie_bbq)
          // These are multipliers that were automatically awarded based on junk conditions
          // Exclude user-activated multipliers (already in multiplierButtons)
          // Note: inherited buttons have names like "pre_double_inherited_1_2", so we need to
          // extract the base multiplier name for filtering
          //
          // NOTE: Even when an override is active, we still show earned multiplier badges
          // (they're informational - the override just replaces the total value, not the display)
          const userMultiplierNames = new Set(
            multiplierButtons.map((m) => {
              // Extract base name from inherited buttons (e.g., "pre_double_inherited_1_2" -> "pre_double")
              const inheritedMatch = m.name.match(/^(.+)_inherited_.+$/);
              return inheritedMatch ? inheritedMatch[1] : m.name;
            }),
          );
          // Also exclude all user-based multipliers from the spec (pre_double, double, etc.)
          // These should only appear as buttons, not as earned badges
          for (const mult of multiplierOptions) {
            userMultiplierNames.add(mult.name);
          }

          // Get spec for looking up display names of automatic multipliers
          // game.spec is the working copy of options
          const spec = game?.spec?.$isLoaded ? game.spec : null;
          const earnedMultiplierButtons: OptionButton[] = (
            holeComplete ? (teamHoleResult?.multipliers ?? []) : []
          )
            .filter((m) => !userMultiplierNames.has(m.name))
            .map((m) => {
              // Look up the option definition from the spec for display name and icon
              // Options are plain JSON objects, no $isLoaded check needed
              const optDef = spec ? spec[m.name] : null;
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
                ownerId: teamId, // For testID: multiplier-{name}-{teamId}
              };
            });

          return (
            <TeamGroup
              teamId={teamId}
              multiplierOptions={multiplierButtons}
              earnedMultipliers={earnedMultiplierButtons}
              teamJunkOptions={teamJunkButtons}
              onMultiplierToggle={(multName) =>
                toggleTeamMultiplier(
                  team,
                  multName,
                  currentHoleNumber,
                  allTeams,
                  multiplierOptions,
                )
              }
              junkTotal={displayJunk}
              holeMultiplier={overallMultiplier}
              holePoints={displayPoints}
              runningDiff={getTeamRunningScore(teamHoleResult)}
              teeFlipWinner={
                teeFlipEnabled && teeFlipRequired && teeFlipWinner === teamId
              }
              onTeeFlipReplay={
                teeFlipEnabled && teeFlipRequired && teeFlipWinner === teamId
                  ? () => setTeeFlipMode("replay")
                  : undefined
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

                // Build user-markable junk options with selected state for this player
                const playerSlug = player.name
                  .toLowerCase()
                  .replace(/\s+/g, "-");
                const userJunkButtons: OptionButton[] = userJunkOptions.map(
                  (junk) => ({
                    name: junk.name,
                    displayName: junk.disp,
                    icon: junk.icon,
                    type: "junk" as const,
                    selected: hasPlayerJunk(team, round.playerId, junk.name),
                    points: junk.value,
                    calculated: false, // User-toggleable
                    ownerId: playerSlug, // For testID: junk-{name}-{playerSlug}
                  }),
                );

                // Build calculated junk options (birdie, eagle) from scoreboard
                // Only include junk that was actually achieved AND hole is complete
                const calculatedJunkButtons: OptionButton[] = holeComplete
                  ? calculatedPlayerJunkOptions
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
                        ownerId: playerSlug, // For testID: junk-{name}-{playerSlug}
                      }))
                  : [];

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
