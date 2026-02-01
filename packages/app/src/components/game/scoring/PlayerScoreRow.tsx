import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Player } from "spicylib/schema";
import { useUIScale } from "@/hooks";
import { Text } from "@/ui";
import { type OptionButton, OptionsButtons } from "./OptionsButtons";
import { ScoreInput } from "./ScoreInput";

interface PlayerScoreRowProps {
  player: Player;
  gross: number | null;
  net: number | null;
  par: number;
  pops: number;
  junkOptions?: OptionButton[];
  onScoreChange: (newGross: number) => void;
  onUnscore: () => void;
  onJunkToggle?: (junkName: string) => void;
  readonly?: boolean;
}

// Column width percentages (must sum to 100)
const COLUMN_PERCENTAGES = {
  name: "40%",
  score: "30%",
  junk: "30%",
} as const;

export function PlayerScoreRow({
  player,
  gross,
  net,
  par,
  pops,
  junkOptions = [],
  onScoreChange,
  onUnscore,
  onJunkToggle,
  readonly = false,
}: PlayerScoreRowProps) {
  const { size } = useUIScale();
  const netPar = par - pops;

  const handleIncrement = (): void => {
    if (gross === null) {
      // If no score, start at net par + 1 (e.g., par 4 with 1 pop: 5 + 1 = 6)
      const startGross = par + pops; // net par as gross
      onScoreChange(Math.min(12, startGross + 1));
    } else if (gross < 12) {
      onScoreChange(gross + 1);
    }
  };

  const handleDecrement = (): void => {
    if (gross === null) {
      // If no score, start at net par - 1 (e.g., par 4 with 1 pop: 5 - 1 = 4)
      const startGross = par + pops; // net par as gross
      onScoreChange(Math.max(1, startGross - 1));
    } else if (gross > 1) {
      onScoreChange(gross - 1);
    }
  };

  const handleScoreTap = (): void => {
    if (gross === null) {
      // If no score, activate at net par (e.g., par 4 with 1 pop: gross = 5 for net 4)
      const startGross = par + pops; // net par as gross
      onScoreChange(startGross);
    }
    // If score exists, do nothing
  };

  const handleOptionPress = (optionName: string): void => {
    onJunkToggle?.(optionName);
  };

  return (
    <View style={styles.container}>
      {/* Score and Junk Row */}
      <View style={styles.scoreRow}>
        {/* Player Name - Left column */}
        <View style={styles.nameColumn}>
          <Text style={styles.playerName} numberOfLines={1}>
            {player.name}
          </Text>
        </View>

        {/* Score Input - Center column */}
        <View style={styles.scoreColumn}>
          <ScoreInput
            gross={gross}
            net={net}
            par={par}
            netPar={netPar}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onScoreTap={handleScoreTap}
            onUnscore={onUnscore}
            readonly={readonly}
            size={size}
            playerId={player.$jazz.id}
          />
        </View>

        {/* Options (Junk/Multipliers) - Right column */}
        <View style={styles.junkColumn}>
          {junkOptions.length > 0 && (
            <OptionsButtons
              options={junkOptions}
              onOptionPress={handleOptionPress}
              readonly={readonly}
              vertical
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.gap(1.5),
    paddingVertical: theme.gap(1),
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameColumn: {
    width: COLUMN_PERCENTAGES.name,
    justifyContent: "center",
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
  },
  scoreColumn: {
    width: COLUMN_PERCENTAGES.score,
    alignItems: "center",
  },
  junkColumn: {
    width: COLUMN_PERCENTAGES.junk,
    alignItems: "flex-end",
  },
}));
