import { FlatList } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Game, GameHole, Score } from "spicylib/schema";
import {
  calculateNetScore,
  calculatePops,
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
  onChangeTeams,
}: ScoringViewProps) {
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

                // Get score for current hole
                const score =
                  round.scores?.$isLoaded &&
                  round.scores[currentHoleIndex]?.$isLoaded
                    ? (round.scores[currentHoleIndex] as Score)
                    : null;

                const gross = getGrossScore(score);
                const pops = getPops(score);
                const net =
                  gross !== null ? calculateNetScore(gross, pops) : null;

                // Calculate pops based on course handicap if no score exists
                const courseHandicap = rtg.courseHandicap ?? 0;
                const calculatedPops = calculatePops(
                  courseHandicap,
                  holeInfo.handicap,
                );

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
