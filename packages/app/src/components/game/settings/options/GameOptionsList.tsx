import { useCallback, useMemo, useState } from "react";
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
  const { game } = useGame(undefined, {
    resolve: {
      specs: {
        $each: {
          options: {
            $each: {
              choices: { $each: true },
            },
          },
          teamsConfig: true,
        },
      },
      options: {
        $each: {
          choices: { $each: true },
        },
      },
      scope: { teamsConfig: true },
      players: { $each: true },
    },
  });

  const { isTeamsMode } = useTeamsMode(game);

  const [selectedOption, setSelectedOption] = useState<GameOption | null>(null);
  const [showModal, setShowModal] = useState(false);

  const saveOptionToGame = useSaveOptionToGame(game);

  const gameOptions = useMemo(() => {
    if (!game?.$isLoaded || !game.specs?.$isLoaded || game.specs.length === 0) {
      return [];
    }

    const spec = game.specs[0];
    if (!spec?.$isLoaded || !spec.options?.$isLoaded) {
      return [];
    }

    const options: GameOption[] = [];
    for (const key in spec.options) {
      const option = spec.options[key];
      if (option?.$isLoaded && option.type === "game") {
        const gameOpt = option as GameOption;
        // Filter out teamOnly options when teams mode is not active
        if (gameOpt.$jazz.has("teamOnly") && gameOpt.teamOnly && !isTeamsMode) {
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

  // Helper to get current value (check game.options first, then fall back to spec)
  const getCurrentValue = useCallback(
    (optionName: string): string | undefined => {
      // Check game.options first (game instance override)
      if (
        game?.$isLoaded &&
        game.$jazz.has("options") &&
        game.options?.$isLoaded
      ) {
        const gameOption = game.options[optionName];
        if (gameOption?.$isLoaded && gameOption.type === "game") {
          const opt = gameOption as GameOption;
          return opt.value ?? opt.defaultValue;
        }
      }

      // Fall back to spec.options
      if (game?.$isLoaded && game.specs?.$isLoaded && game.specs.length > 0) {
        const spec = game.specs[0];
        if (spec?.$isLoaded && spec.options?.$isLoaded) {
          const specOption = spec.options[optionName];
          if (specOption?.$isLoaded && specOption.type === "game") {
            const opt = specOption as GameOption;
            return opt.value ?? opt.defaultValue;
          }
        }
      }

      return undefined;
    },
    [game],
  );

  const handleOptionPress = useCallback((option: GameOption) => {
    setSelectedOption(option);
    setShowModal(true);
  }, []);

  const handleOptionSelect = useCallback(
    (value: string) => {
      if (!selectedOption) {
        return;
      }

      saveOptionToGame(selectedOption.name, value);
    },
    [selectedOption, saveOptionToGame],
  );

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedOption(null);
  }, []);

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
