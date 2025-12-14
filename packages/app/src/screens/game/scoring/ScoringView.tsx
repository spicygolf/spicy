import { FlatList } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Game, GameHole } from "spicylib/schema";
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
  let adjustedHandicaps: Map<string, number> | null = null;
  if (useHandicaps && handicapMode === "low" && game.rounds?.$isLoaded) {
    const playerHandicaps = [];
    for (const rtg of game.rounds) {
      if (!rtg?.$isLoaded || !rtg.round?.$isLoaded) continue;

      playerHandicaps.push({
        playerId: rtg.round.playerId,
        courseHandicap: rtg.courseHandicap ?? 0,
        gameHandicap: rtg.gameHandicap,
      });
    }
    adjustedHandicaps = adjustHandicapsToLow(playerHandicaps);
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

          return (
            <TeamGroup onChangeTeams={onChangeTeams}>
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

                // Calculate pops based on effective handicap
                // Priority: gameHandicap > courseHandicap > calculated from tee
                let courseHandicap = rtg.courseHandicap;

                // If courseHandicap is not set, calculate it from the tee data
                if (courseHandicap === undefined && round.$jazz.has("tee")) {
                  const tee = round.tee;
                  if (tee?.$isLoaded) {
                    const handicapIndex =
                      rtg.handicapIndex || round.handicapIndex;
                    const calculated = calculateCourseHandicap({
                      handicapIndex,
                      tee,
                      holesPlayed: "all18", // TODO: Get from game.scope.holes
                    });
                    // Convert null to undefined for type compatibility
                    courseHandicap = calculated ?? undefined;
                  }
                }

                // Calculate pops and net only if handicaps are used
                let calculatedPops = 0;
                let net: number | null = null;

                if (useHandicaps) {
                  // Default to 0 if we still don't have a course handicap
                  const finalCourseHandicap = courseHandicap ?? 0;

                  const effectiveHandicap = getEffectiveHandicap(
                    finalCourseHandicap,
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

                return (
                  <PlayerScoreRow
                    key={rtg.$jazz.id}
                    player={player}
                    gross={gross}
                    net={net}
                    par={holeInfo.par}
                    pops={calculatedPops}
                    onScoreChange={(newGross) =>
                      onScoreChange(rtg.$jazz.id, newGross)
                    }
                    onUnscore={() => onUnscore(rtg.$jazz.id)}
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
