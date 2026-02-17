import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { GameOption, JunkOption, MultiplierOption } from "spicylib/schema";
import { isEveningCreation } from "spicylib/utils";
import { useGame, useSaveOptionToGame, useTeamsMode } from "@/hooks";
import type { GameSettingsStackParamList } from "@/screens/game/settings/GameSettings";
import { BoolOptionModal } from "./BoolOptionModal";
import { DeleteGameButton } from "./DeleteGameButton";
import { formatOptionValue } from "./formatOptionValue";
import { GameNameModal } from "./GameNameModal";
import { GameNameRow } from "./GameNameRow";
import { GameOptionRow } from "./GameOptionRow";
import { JunkOptionRow } from "./JunkOptionRow";
import { MenuOptionModal } from "./MenuOptionModal";
import { MultiplierOptionRow } from "./MultiplierOptionRow";
import { NumOptionModal } from "./NumOptionModal";
import { OptionSectionHeader } from "./OptionSectionHeader";
import { RemoveOptionModal } from "./RemoveOptionModal";
import { ResetSpecButton } from "./ResetSpecButton";
import { TeeTimeModal } from "./TeeTimeModal";
import { TeeTimeRow } from "./TeeTimeRow";
import { TextOptionModal } from "./TextOptionModal";

type ModalType = "game" | "junk" | "multiplier" | null;

export function GameOptionsList() {
  // Single subscription for the entire Options tab. ResetSpecButton and
  // DeleteGameButton receive `game` as a prop instead of calling useGame()
  // themselves, reducing the total Jazz subscription count on this screen.
  const navigation =
    useNavigation<NativeStackNavigationProp<GameSettingsStackParamList>>();

  const { game } = useGame(undefined, {
    resolve: {
      spec: { $each: true },
      specRef: { $each: true },
      scope: { teamsConfig: true },
      players: { $each: true },
      rounds: { $each: { round: { scores: true } } },
      holes: { $each: { options: true } },
    },
  });

  const { isTeamsMode } = useTeamsMode(game);

  const [selectedOptionName, setSelectedOptionName] = useState<string | null>(
    null,
  );
  const [modalType, setModalType] = useState<ModalType>(null);
  const [showModal, setShowModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showTeeTimeModal, setShowTeeTimeModal] = useState(false);

  // Check if this game was created in the evening (for tee time caution banner).
  // Uses Jazz's immutable createdAt rather than the editable tee time (game.start).
  const isEvening = game?.$isLoaded
    ? isEveningCreation(new Date(game.$jazz.createdAt))
    : false;

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

  // Check if any hole has an override for a given option
  const getHasOverrides = useCallback(
    (optionName: string): boolean => {
      if (!game?.holes?.$isLoaded) return false;
      for (const hole of game.holes) {
        if (!hole?.$isLoaded) continue;
        if (
          hole.$jazz.has("options") &&
          hole.options?.$isLoaded &&
          hole.options.$jazz.has(optionName)
        ) {
          return true;
        }
      }
      return false;
    },
    [game],
  );

  // Get a "val1 / val2" display string when per-hole overrides create mixed values
  const getDisplayOverride = useCallback(
    (option: GameOption): string | undefined => {
      if (!game?.holes?.$isLoaded) return undefined;
      if (!getHasOverrides(option.name)) return undefined;

      const gameDefault = getCurrentValue(option.name) ?? option.defaultValue;
      const values = new Set<string>();
      values.add(gameDefault);

      for (const hole of game.holes) {
        if (!hole?.$isLoaded) continue;
        if (
          hole.$jazz.has("options") &&
          hole.options?.$isLoaded &&
          hole.options.$jazz.has(option.name)
        ) {
          const override = hole.options[option.name];
          if (override && override.type === "game") {
            const val =
              (override as GameOption).value ??
              (override as GameOption).defaultValue;
            if (val !== undefined) values.add(val);
          }
        }
      }

      if (values.size <= 1) return undefined;

      return Array.from(values)
        .map((v) => formatOptionValue(option, v))
        .join(" / ");
    },
    [game, getHasOverrides, getCurrentValue],
  );

  const handleCustomizePress = useCallback(
    (optionName: string) => {
      navigation.navigate("HoleOverrides", { optionName });
    },
    [navigation],
  );

  const handleSaveName = useCallback(
    (name: string) => {
      if (game?.$isLoaded) {
        game.$jazz.set("name", name);
      }
    },
    [game],
  );

  const handleSaveTeeTime = useCallback(
    (date: Date) => {
      if (game?.$isLoaded) {
        game.$jazz.set("start", date);
      }
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Game Info Section */}
        {game?.$isLoaded && (
          <>
            <OptionSectionHeader title="Game" />
            <GameNameRow
              name={game.name}
              onPress={() => setShowNameModal(true)}
            />
            <TeeTimeRow
              start={game.start}
              onPress={() => setShowTeeTimeModal(true)}
            />
          </>
        )}

        {/* Game Options Section */}
        {gameOptions.length > 0 && (
          <>
            <OptionSectionHeader title="Settings" />
            {gameOptions.map((option) => {
              const displayOverride = getDisplayOverride(option);
              return (
                <GameOptionRow
                  key={option.name}
                  option={option}
                  currentValue={getCurrentValue(option.name)}
                  onPress={
                    displayOverride
                      ? () => handleCustomizePress(option.name)
                      : () => handleGameOptionPress(option)
                  }
                  displayOverride={displayOverride}
                />
              );
            })}
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
        <ResetSpecButton game={game} />
        <DeleteGameButton game={game} />
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
              onCustomize={() => handleCustomizePress(selectedGameOption.name)}
              hasOverrides={getHasOverrides(selectedGameOption.name)}
            />
          )}
          {selectedGameOption.valueType === "menu" && (
            <MenuOptionModal
              visible={showModal}
              option={selectedGameOption}
              currentValue={getCurrentValue(selectedGameOption.name)}
              onSelect={handleOptionSelect}
              onClose={handleCloseModal}
              onCustomize={() => handleCustomizePress(selectedGameOption.name)}
              hasOverrides={getHasOverrides(selectedGameOption.name)}
            />
          )}
          {selectedGameOption.valueType === "num" && (
            <NumOptionModal
              visible={showModal}
              option={selectedGameOption}
              currentValue={getCurrentValue(selectedGameOption.name)}
              onSelect={handleOptionSelect}
              onClose={handleCloseModal}
              onCustomize={() => handleCustomizePress(selectedGameOption.name)}
              hasOverrides={getHasOverrides(selectedGameOption.name)}
            />
          )}
          {selectedGameOption.valueType === "text" && (
            <TextOptionModal
              visible={showModal}
              option={selectedGameOption}
              currentValue={getCurrentValue(selectedGameOption.name)}
              onSelect={handleOptionSelect}
              onClose={handleCloseModal}
              onCustomize={() => handleCustomizePress(selectedGameOption.name)}
              hasOverrides={getHasOverrides(selectedGameOption.name)}
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

      {/* Game Name Modal — rendered only when open so useState resets on each mount */}
      {game?.$isLoaded && showNameModal && (
        <GameNameModal
          currentName={game.name}
          onSave={handleSaveName}
          onClose={() => setShowNameModal(false)}
        />
      )}

      {/* Tee Time Modal — rendered only when open so useState resets on each mount */}
      {game?.$isLoaded && showTeeTimeModal && (
        <TeeTimeModal
          currentDate={game.start}
          isEvening={isEvening}
          onSave={handleSaveTeeTime}
          onClose={() => setShowTeeTimeModal(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create((_theme) => ({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
}));
