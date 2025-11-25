import { FlatList } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Game, GameHole, Score } from "spicylib/schema";
import {
  calculateNetScore,
  calculatePops,
  getEffectiveHandicap,
  getGrossScore,
  getPops,
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
  // TODO: Read from game.optionOverrides when we implement game options UI
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

                // Get score for current hole (use string key for MapOfScores)
                const holeKey = String(currentHoleIndex);
                const score =
                  round.scores?.$isLoaded && round.scores[holeKey]?.$isLoaded
                    ? (round.scores[holeKey] as Score)
                    : null;

                const gross = getGrossScore(score);
                const pops = getPops(score);
                const net =
                  gross !== null ? calculateNetScore(gross, pops) : null;

                // Calculate pops based on effective handicap
                // Priority: gameHandicap > courseHandicap
                const courseHandicap = rtg.courseHandicap ?? 0;
                const effectiveHandicap = getEffectiveHandicap(
                  courseHandicap,
                  rtg.gameHandicap,
                );

                // TODO: Use adjusted handicap if in "low" mode
                // const handicapForPops = adjustedHandicaps?.get(round.playerId) ?? effectiveHandicap;

                const calculatedPops = calculatePops(
                  effectiveHandicap,
                  holeInfo.handicap,
                );

                console.log("[ScoringView] Player pops calculation:", {
                  playerName: player.name,
                  holeNumber: holeInfo.number,
                  holeHandicap: holeInfo.handicap,
                  courseHandicap,
                  gameHandicap: rtg.gameHandicap,
                  effectiveHandicap,
                  calculatedPops,
                });

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
