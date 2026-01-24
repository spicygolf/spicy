import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { GameOption } from "spicylib/schema";
import { useGame, useSaveOptionToGame, useTeamsMode } from "@/hooks";
import { Text } from "@/ui";
import { BoolOptionModal } from "./BoolOptionModal";
import { DeleteGameButton } from "./DeleteGameButton";
import { GameOptionRow } from "./GameOptionRow";
import { MenuOptionModal } from "./MenuOptionModal";
import { NumOptionModal } from "./NumOptionModal";
import { TextOptionModal } from "./TextOptionModal";

export function GameOptionsList() {
  // game.spec is the working copy of options (user modifications go here)
  // Options are plain JSON objects, so just need $each: true (not nested)
  const { game } = useGame(undefined, {
    resolve: {
      spec: { $each: true },
      scope: { teamsConfig: true },
      players: { $each: true },
    },
  });

  const { isTeamsMode } = useTeamsMode(game);

  const [selectedOptionName, setSelectedOptionName] = useState<string | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);

  const saveOptionToGame = useSaveOptionToGame(game);

  // Get game options from game.spec (the working copy)
  // Options are plain JSON objects now, no $isLoaded checks needed
  const gameOptions = useMemo(() => {
    if (!game?.$isLoaded || !game.spec?.$isLoaded) {
      return [];
    }

    const spec = game.spec;
    const options: GameOption[] = [];
    for (const key of Object.keys(spec)) {
      if (key.startsWith("$") || key === "_refs") continue;
      const option = spec[key];
      if (option && option.type === "game") {
        const gameOpt = option as GameOption;
        // Filter out teamOnly options when teams mode is not active
        if (gameOpt.teamOnly && !isTeamsMode) {
          continue;
        }
        options.push(gameOpt);
      }
    }

    return options.sort((a, b) => {
      const seqA = a.seq ?? 999;
      const seqB = b.seq ?? 999;
      return seqA - seqB;
    });
  }, [game, isTeamsMode]);

  // Helper to get current value from game.spec
  const getCurrentValue = useCallback(
    (optionName: string): string | undefined => {
      if (!game?.$isLoaded || !game.spec?.$isLoaded) {
        return undefined;
      }

      const specOption = game.spec[optionName];
      if (specOption && specOption.type === "game") {
        const opt = specOption as GameOption;
        return opt.value ?? opt.defaultValue;
      }

      return undefined;
    },
    [game],
  );

  const handleOptionPress = useCallback((option: GameOption) => {
    setSelectedOptionName(option.name);
    setShowModal(true);
  }, []);

  const handleOptionSelect = useCallback(
    (value: string) => {
      if (!selectedOptionName) {
        return;
      }

      saveOptionToGame(selectedOptionName, value);
    },
    [selectedOptionName, saveOptionToGame],
  );

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedOptionName(null);
  }, []);

  // Look up the selected option from gameOptions by name
  const selectedOption = selectedOptionName
    ? (gameOptions.find((opt) => opt.name === selectedOptionName) ?? null)
    : null;

  // Auto-clear modal state if the selected option no longer exists
  useEffect(() => {
    if (showModal && selectedOptionName && !selectedOption) {
      setShowModal(false);
      setSelectedOptionName(null);
    }
  }, [showModal, selectedOptionName, selectedOption]);

  if (gameOptions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No game options available</Text>
        <DeleteGameButton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {gameOptions.map((option) => (
          <GameOptionRow
            key={option.name}
            option={option}
            currentValue={getCurrentValue(option.name)}
            onPress={() => handleOptionPress(option)}
          />
        ))}
        <DeleteGameButton />
      </ScrollView>

      {selectedOption && (
        <>
          {selectedOption.valueType === "bool" && (
            <BoolOptionModal
              visible={showModal}
              option={selectedOption}
              currentValue={getCurrentValue(selectedOption.name)}
              onSelect={handleOptionSelect}
              onClose={handleCloseModal}
            />
          )}
          {selectedOption.valueType === "menu" && (
            <MenuOptionModal
              visible={showModal}
              option={selectedOption}
              currentValue={getCurrentValue(selectedOption.name)}
              onSelect={handleOptionSelect}
              onClose={handleCloseModal}
            />
          )}
          {selectedOption.valueType === "num" && (
            <NumOptionModal
              visible={showModal}
              option={selectedOption}
              currentValue={getCurrentValue(selectedOption.name)}
              onSelect={handleOptionSelect}
              onClose={handleCloseModal}
            />
          )}
          {selectedOption.valueType === "text" && (
            <TextOptionModal
              visible={showModal}
              option={selectedOption}
              currentValue={getCurrentValue(selectedOption.name)}
              onSelect={handleOptionSelect}
              onClose={handleCloseModal}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(4),
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.secondary,
  },
}));
