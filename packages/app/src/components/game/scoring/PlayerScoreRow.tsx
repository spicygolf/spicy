import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { Player } from "spicylib/schema";
import { Text } from "@/ui";
import { OptionsButtons } from "./OptionsButtons";
import { ScoreInput } from "./ScoreInput";

interface PlayerScoreRowProps {
  player: Player;
  gross: number | null;
  net: number | null;
  par: number;
  pops: number;
  onScoreChange: (newGross: number) => void;
  onUnscore: () => void;
  readonly?: boolean;
}

export function PlayerScoreRow({
  player,
  gross,
  net,
  par,
  pops,
  onScoreChange,
  onUnscore,
  readonly = false,
}: PlayerScoreRowProps) {
  const netPar = par - pops;

  const handleIncrement = (): void => {
    console.log("[PlayerScoreRow] handleIncrement called", {
      gross,
      par,
      netPar,
    });
    if (gross === null) {
      // If no score, start at net par + 1 (e.g., par 4 with 1 pop: 5 + 1 = 6)
      const startGross = par + pops; // net par as gross
      onScoreChange(Math.min(12, startGross + 1));
    } else if (gross < 12) {
      onScoreChange(gross + 1);
    }
  };

  const handleDecrement = (): void => {
    console.log("[PlayerScoreRow] handleDecrement called", {
      gross,
      par,
      netPar,
    });
    if (gross === null) {
      // If no score, start at net par - 1 (e.g., par 4 with 1 pop: 5 - 1 = 4)
      const startGross = par + pops; // net par as gross
      onScoreChange(Math.max(1, startGross - 1));
    } else if (gross > 1) {
      onScoreChange(gross - 1);
    }
  };

  const handleScoreTap = (): void => {
    console.log("[PlayerScoreRow] handleScoreTap called", {
      gross,
      par,
      netPar,
    });
    if (gross === null) {
      // If no score, activate at net par (e.g., par 4 with 1 pop: gross = 5 for net 4)
      const startGross = par + pops; // net par as gross
      onScoreChange(startGross);
    }
    // If score exists, do nothing
  };

  // Placeholder for options - will be implemented when options/junk system is added
  const options: never[] = [];
  const handleOptionPress = (optionName: string): void => {
    // TODO: Implement option toggle when options/junk system is ready
    console.log("Option pressed:", optionName);
  };

  return (
    <View style={styles.container}>
      {/* Player Name */}
      <View style={styles.playerHeader}>
        <Text style={styles.playerName}>{player.name}</Text>
      </View>

      {/* Score Input */}
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
      />

      {/* Options (Junk/Multipliers) */}
      {options.length > 0 && (
        <OptionsButtons
          options={options}
          onOptionPress={handleOptionPress}
          readonly={readonly}
        />
      )}
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
  playerHeader: {
    marginBottom: theme.gap(0.5),
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
  },
}));
