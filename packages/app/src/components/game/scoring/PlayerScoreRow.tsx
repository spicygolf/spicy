import { ScrollView, View } from "react-native";
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

// Base column widths at scale 1.0 (lg)
const BASE_COLUMN_WIDTHS = {
  name: 130,
  score: 110,
  junk: 100,
};

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
  const { size, scaled } = useUIScale();
  const netPar = par - pops;

  // Scale column widths based on UI scale
  const columnWidths = {
    name: scaled(BASE_COLUMN_WIDTHS.name),
    score: scaled(BASE_COLUMN_WIDTHS.score),
    junk: scaled(BASE_COLUMN_WIDTHS.junk),
  };

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
        {/* Player Name - Left column, scaled width */}
        <View style={[styles.nameColumn, { width: columnWidths.name }]}>
          <Text style={styles.playerName} numberOfLines={1}>
            {player.name}
          </Text>
        </View>

        {/* Score Input - Center column, scaled width */}
        <View style={[styles.scoreColumn, { width: columnWidths.score }]}>
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
          />
        </View>

        {/* Options (Junk/Multipliers) - Right column, scaled min width */}
        <View style={[styles.junkColumn, { minWidth: columnWidths.junk }]}>
          {junkOptions.length > 0 && (
            <ScrollView
              style={styles.junkScroll}
              contentContainerStyle={styles.junkScrollContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              <OptionsButtons
                options={junkOptions}
                onOptionPress={handleOptionPress}
                readonly={readonly}
                vertical
              />
            </ScrollView>
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
    justifyContent: "center",
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
  },
  scoreColumn: {
    alignItems: "center",
  },
  junkColumn: {
    flex: 1,
    alignItems: "flex-end",
  },
  junkScroll: {
    maxHeight: 80,
  },
  junkScrollContent: {
    alignItems: "flex-end",
  },
}));
