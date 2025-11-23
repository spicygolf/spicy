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
  readonly?: boolean;
}

export function PlayerScoreRow({
  player,
  gross,
  net,
  par,
  pops,
  onScoreChange,
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
      // If no score, start at net par
      onScoreChange(netPar);
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
      // If no score, start at net par - 1
      onScoreChange(Math.max(1, netPar - 1));
    } else if (gross > 1) {
      onScoreChange(gross - 1);
    }
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
