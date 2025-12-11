import { FlatList } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Game, GameHole } from "spicylib/schema";
import {
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
  // Handicap mode - for now hardcoded to "full"
  // TODO: Read from game.options when we implement game options UI
  // Jazz's reactivity handles updates automatically - no useMemo needed

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

                // Default to 0 if we still don't have a course handicap
                const finalCourseHandicap = courseHandicap ?? 0;

                const effectiveHandicap = getEffectiveHandicap(
                  finalCourseHandicap,
                  rtg.gameHandicap,
                );

                // TODO: Use adjusted handicap if in "low" mode
                // const handicapForPops = adjustedHandicaps?.get(round.playerId) ?? effectiveHandicap;

                const calculatedPops = calculatePops(
                  effectiveHandicap,
                  holeInfo.handicap,
                );

                // Calculate net using the calculated pops (not stored pops from score)
                const net =
                  gross !== null
                    ? calculateNetScore(gross, calculatedPops)
                    : null;

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
