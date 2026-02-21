import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Game, GameHole } from "spicylib/schema";
import { getTeamAssignmentsFromHole } from "spicylib/utils";
import { HoleHeader } from "@/components/game/scoring";
import { TeamChooser } from "@/components/game/TeamChooser";
import type { HoleInfo } from "@/hooks";
import { Text } from "@/ui";

export interface TeamChooserViewProps {
  game: Game;
  holeInfo: HoleInfo;
  teamCount: number;
  currentHole: GameHole | null;
  onPrevHole: () => void;
  onNextHole: () => void;
  onAssignmentsChange: (assignments: Map<string, number>) => void;
}

export function TeamChooserView({
  game,
  holeInfo,
  teamCount,
  currentHole,
  onPrevHole,
  onNextHole,
  onAssignmentsChange,
}: TeamChooserViewProps) {
  return (
    <ScrollView style={styles.content}>
      <HoleHeader hole={holeInfo} onPrevious={onPrevHole} onNext={onNextHole} />
      <View style={styles.chooserContainer}>
        <Text style={styles.chooserTitle}>Choose Teams</Text>
        <TeamChooser
          game={game}
          teamCount={teamCount}
          initialAssignments={getTeamAssignmentsFromHole(
            currentHole || undefined,
          )}
          onAssignmentsChange={onAssignmentsChange}
          showTossBalls={true}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: {
    flex: 1,
  },
  chooserContainer: {
    flex: 1,
    paddingTop: theme.gap(2),
  },
  chooserTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: theme.gap(2),
  },
}));
