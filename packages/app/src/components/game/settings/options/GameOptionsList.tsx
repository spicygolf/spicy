import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { GameOption, JunkOption, MultiplierOption } from "spicylib/schema";
import { useGame, useSaveOptionToGame, useTeamsMode } from "@/hooks";
import { Text } from "@/ui";
import { BoolOptionModal } from "./BoolOptionModal";
import { DeleteGameButton } from "./DeleteGameButton";
import { GameOptionRow } from "./GameOptionRow";
import { JunkOptionRow } from "./JunkOptionRow";
import { MenuOptionModal } from "./MenuOptionModal";
import { MultiplierOptionRow } from "./MultiplierOptionRow";
import { NumOptionModal } from "./NumOptionModal";
import { OptionSectionHeader } from "./OptionSectionHeader";
import { RemoveOptionModal } from "./RemoveOptionModal";
import { TextOptionModal } from "./TextOptionModal";

type ModalType = "game" | "junk" | "multiplier" | null;

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
  const [modalType, setModalType] = useState<ModalType>(null);
  const [showModal, setShowModal] = useState(false);

  const saveOptionToGame = useSaveOptionToGame(game);

  // Get options from game.spec (the working copy), grouped by type
  // Options are plain JSON objects now, no $isLoaded checks needed
  const { gameOptions, junkOptions, multiplierOptions } = useMemo(() => {
    if (!game?.$isLoaded || !game.spec?.$isLoaded) {
      return { gameOptions: [], junkOptions: [], multiplierOptions: [] };
    }

    const spec = game.spec;
    const gameOpts: GameOption[] = [];
    const junkOpts: JunkOption[] = [];
    const multiplierOpts: MultiplierOption[] = [];

    for (const key of Object.keys(spec)) {
      if (key.startsWith("$") || key === "_refs") continue;
      const option = spec[key];
      if (!option) continue;

      if (option.type === "game") {
        const gameOpt = option as GameOption;
        // Filter out teamOnly options when teams mode is not active
        if (gameOpt.teamOnly && !isTeamsMode) {
          continue;
        }
        gameOpts.push(gameOpt);
      } else if (option.type === "junk") {
        junkOpts.push(option as JunkOption);
      } else if (option.type === "multiplier") {
        multiplierOpts.push(option as MultiplierOption);
      }
    }

    const sortBySeq = <T extends { seq?: number }>(a: T, b: T) =>
      (a.seq ?? 999) - (b.seq ?? 999);

    return {
      gameOptions: gameOpts.sort(sortBySeq),
      junkOptions: junkOpts.sort(sortBySeq),
      multiplierOptions: multiplierOpts.sort(sortBySeq),
    };
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

  const handleGameOptionPress = useCallback((option: GameOption) => {
    setSelectedOptionName(option.name);
    setModalType("game");
    setShowModal(true);
  }, []);

  const handleJunkOptionPress = useCallback((option: JunkOption) => {
    setSelectedOptionName(option.name);
    setModalType("junk");
    setShowModal(true);
  }, []);

  const handleMultiplierOptionPress = useCallback(
    (option: MultiplierOption) => {
      setSelectedOptionName(option.name);
      setModalType("multiplier");
      setShowModal(true);
    },
    [],
  );

  const handleOptionSelect = useCallback(
    (value: string) => {
      if (!selectedOptionName) {
        return;
      }

      saveOptionToGame(selectedOptionName, value);
    },
    [selectedOptionName, saveOptionToGame],
  );

  const handleRemoveOption = useCallback(() => {
    if (!selectedOptionName || !game?.spec?.$isLoaded) {
      return;
    }

    // Remove the option from the game's spec
    game.spec.$jazz.delete(selectedOptionName);
    setShowModal(false);
    setSelectedOptionName(null);
    setModalType(null);
  }, [selectedOptionName, game]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedOptionName(null);
    setModalType(null);
  }, []);

  // Look up the selected option by name based on modal type
  const selectedGameOption =
    modalType === "game" && selectedOptionName
      ? (gameOptions.find((opt) => opt.name === selectedOptionName) ?? null)
      : null;

  const selectedJunkOption =
    modalType === "junk" && selectedOptionName
      ? (junkOptions.find((opt) => opt.name === selectedOptionName) ?? null)
      : null;

  const selectedMultiplierOption =
    modalType === "multiplier" && selectedOptionName
      ? (multiplierOptions.find((opt) => opt.name === selectedOptionName) ??
        null)
      : null;

  // Auto-clear modal state if the selected option no longer exists
  useEffect(() => {
    if (showModal && selectedOptionName) {
      const optionExists =
        selectedGameOption || selectedJunkOption || selectedMultiplierOption;
      if (!optionExists) {
        setShowModal(false);
        setSelectedOptionName(null);
        setModalType(null);
      }
    }
  }, [
    showModal,
    selectedOptionName,
    selectedGameOption,
    selectedJunkOption,
    selectedMultiplierOption,
  ]);

  const hasNoOptions =
    gameOptions.length === 0 &&
    junkOptions.length === 0 &&
    multiplierOptions.length === 0;

  if (hasNoOptions) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No options available</Text>
        <DeleteGameButton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Game Options Section */}
        {gameOptions.length > 0 && (
          <>
            <OptionSectionHeader title="Settings" />
            {gameOptions.map((option) => (
              <GameOptionRow
                key={option.name}
                option={option}
                currentValue={getCurrentValue(option.name)}
                onPress={() => handleGameOptionPress(option)}
              />
            ))}
          </>
        )}

        {/* Junk Options Section */}
        {junkOptions.length > 0 && (
          <>
            <OptionSectionHeader title="Junk (Points)" />
            {junkOptions.map((option) => (
              <JunkOptionRow
                key={option.name}
                option={option}
                onPress={() => handleJunkOptionPress(option)}
              />
            ))}
          </>
        )}

        {/* Multiplier Options Section */}
        {multiplierOptions.length > 0 && (
          <>
            <OptionSectionHeader title="Multipliers" />
            {multiplierOptions.map((option) => (
              <MultiplierOptionRow
                key={option.name}
                option={option}
                onPress={() => handleMultiplierOptionPress(option)}
              />
            ))}
          </>
        )}

        {/* Admin Section */}
        <OptionSectionHeader title="Admin" />
        <DeleteGameButton />
      </ScrollView>

      {/* Game Option Modals */}
      {selectedGameOption && (
        <>
          {selectedGameOption.valueType === "bool" && (
            <BoolOptionModal
              visible={showModal}
              option={selectedGameOption}
              currentValue={getCurrentValue(selectedGameOption.name)}
              onSelect={handleOptionSelect}
              onClose={handleCloseModal}
            />
          )}
          {selectedGameOption.valueType === "menu" && (
            <MenuOptionModal
              visible={showModal}
              option={selectedGameOption}
              currentValue={getCurrentValue(selectedGameOption.name)}
              onSelect={handleOptionSelect}
              onClose={handleCloseModal}
            />
          )}
          {selectedGameOption.valueType === "num" && (
            <NumOptionModal
              visible={showModal}
              option={selectedGameOption}
              currentValue={getCurrentValue(selectedGameOption.name)}
              onSelect={handleOptionSelect}
              onClose={handleCloseModal}
            />
          )}
          {selectedGameOption.valueType === "text" && (
            <TextOptionModal
              visible={showModal}
              option={selectedGameOption}
              currentValue={getCurrentValue(selectedGameOption.name)}
              onSelect={handleOptionSelect}
              onClose={handleCloseModal}
            />
          )}
        </>
      )}

      {/* Junk/Multiplier Remove Modal */}
      <RemoveOptionModal
        visible={
          showModal && (modalType === "junk" || modalType === "multiplier")
        }
        option={selectedJunkOption || selectedMultiplierOption}
        onRemove={handleRemoveOption}
        onClose={handleCloseModal}
      />
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
