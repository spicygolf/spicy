import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { useEffect, useRef, useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { Game } from "spicylib/schema";
import { getGrossScore, getScoreToPar } from "spicylib/utils";
import { useOptionValue } from "@/hooks/useOptionValue";
import { Text } from "@/ui";
import {
  buildPlayerList,
  findFirstUnscoredHole,
  type PlayerEntry,
  removeRapidScore,
  writeRapidScore,
} from "./rapidEntryUtils";

/** Auto-advance timeout for pending "1" digit (ms) */
const PENDING_TIMEOUT_MS = 1500;

interface RapidEntryViewProps {
  game: Game;
  holesList: string[];
  groupRoundIds?: Set<string>;
  onExit: () => void;
}

export function RapidEntryView({
  game,
  holesList,
  groupRoundIds,
  onExit,
}: RapidEntryViewProps) {
  const { theme } = useUnistyles();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Handicap configuration (same pattern as useScoreManagement)
  const useHandicapsValue = useOptionValue(game, null, "use_handicaps", "game");
  const useHandicaps =
    useHandicapsValue === "true" || useHandicapsValue === "1";
  const handicapIndexFromValue = useOptionValue(
    game,
    null,
    "handicap_index_from",
    "game",
  );
  const handicapMode: "full" | "low" =
    handicapIndexFromValue === "full" ? "full" : "low";

  const totalHoles = holesList.length;

  // Build player list directly (Jazz reactive proxy — no useMemo)
  const playerList: PlayerEntry[] = buildPlayerList(game, groupRoundIds);

  // Player navigation
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const safeIndex = Math.min(
    currentPlayerIndex,
    Math.max(0, playerList.length - 1),
  );
  const currentPlayer = playerList[safeIndex] ?? null;

  // Active hole (1-indexed)
  const [activeHole, setActiveHole] = useState(1);

  // Pending digit state for "1" prefix logic
  const [pendingDigit, setPendingDigit] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingDigit = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPendingDigit(null);
  };

  // Cancel any pending digit and switch to a new hole
  const handleHoleTap = (hole: number) => {
    cancelPendingDigit();
    setActiveHole(hole);
  };

  // Auto-focus first unscored hole when player changes.
  // Uses a ref to track the previous player and detect changes during render,
  // since Jazz reactive proxies make useEffect deps unreliable.
  const prevPlayerRef = useRef(currentPlayer?.roundToGameId);
  if (currentPlayer && currentPlayer.roundToGameId !== prevPlayerRef.current) {
    prevPlayerRef.current = currentPlayer.roundToGameId;
    // Schedule state updates for next tick (can't setState during render)
    queueMicrotask(() => {
      const firstUnscored = findFirstUnscoredHole(
        currentPlayer.round,
        totalHoles,
      );
      setActiveHole(firstUnscored);
      cancelPendingDigit();
    });
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handlePrevPlayer = () => {
    if (playerList.length === 0) return;
    cancelPendingDigit();
    setCurrentPlayerIndex((prev) =>
      prev === 0 ? playerList.length - 1 : prev - 1,
    );
  };

  const handleNextPlayer = () => {
    if (playerList.length === 0) return;
    cancelPendingDigit();
    setCurrentPlayerIndex((prev) =>
      prev === playerList.length - 1 ? 0 : prev + 1,
    );
  };

  const advanceHole = () => {
    setActiveHole((prev) => (prev < totalHoles ? prev + 1 : prev));
  };

  const commitScore = (score: number) => {
    if (!currentPlayer) return;
    const holeNum = holesList[activeHole - 1] ?? String(activeHole);
    const holeAllocation = currentPlayer.handicapMap.get(holeNum) ?? 10;
    writeRapidScore(
      game,
      currentPlayer.roundToGameId,
      holeNum,
      score,
      holeAllocation,
      useHandicaps,
      handicapMode,
    );
    advanceHole();
  };

  const handleDigitPress = (digit: string) => {
    if (!currentPlayer) return;

    if (pendingDigit === "1") {
      // Second digit after "1" — combine
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      setPendingDigit(null);
      const score = Number.parseInt(`1${digit}`, 10);
      commitScore(score);
      return;
    }

    if (digit === "1") {
      // Start pending — wait for second digit
      setPendingDigit("1");
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setPendingDigit(null);
        commitScore(1);
      }, PENDING_TIMEOUT_MS);
      return;
    }

    // Non-"1" digit — write immediately
    commitScore(Number.parseInt(digit, 10));
  };

  const handleClear = () => {
    if (!currentPlayer) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setPendingDigit(null);
    removeRapidScore(
      game,
      currentPlayer.roundToGameId,
      holesList[activeHole - 1] ?? String(activeHole),
    );
  };

  const handleBackspace = () => {
    if (pendingDigit) {
      // Cancel pending "1"
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      setPendingDigit(null);
      return;
    }
    // Navigate to previous hole
    setActiveHole((prev) => (prev > 1 ? prev - 1 : prev));
  };

  if (playerList.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No players available</Text>
        <Pressable onPress={onExit} style={styles.exitButton}>
          <Text style={[styles.exitButtonText, { color: theme.colors.action }]}>
            Back to Scoring
          </Text>
        </Pressable>
      </View>
    );
  }

  // Determine front/back 9 hole positions (1-indexed)
  const front9 = holesList.slice(0, 9).map((_, i) => i + 1);
  const back9 = holesList.slice(9, 18).map((_, i) => i + 10);

  return (
    <View style={styles.container}>
      {/* Player Header */}
      <PlayerHeader
        playerName={currentPlayer?.playerName ?? ""}
        playerIndex={safeIndex}
        totalPlayers={playerList.length}
        onPrev={handlePrevPlayer}
        onNext={handleNextPlayer}
        onExit={onExit}
      />

      {/* Hole Grid */}
      <View
        style={[
          styles.gridContainer,
          isLandscape ? styles.gridLandscape : styles.gridPortrait,
        ]}
      >
        <NineHoleRow
          holes={front9}
          holesList={holesList}
          label="OUT"
          round={currentPlayer?.round ?? null}
          parMap={currentPlayer?.parMap ?? new Map()}
          activeHole={activeHole}
          pendingDigit={pendingDigit}
          onHoleTap={handleHoleTap}
        />
        {back9.length > 0 && (
          <NineHoleRow
            holes={back9}
            holesList={holesList}
            label="IN"
            round={currentPlayer?.round ?? null}
            parMap={currentPlayer?.parMap ?? new Map()}
            activeHole={activeHole}
            pendingDigit={pendingDigit}
            onHoleTap={handleHoleTap}
          />
        )}
      </View>

      {/* Numeric Keypad */}
      <NumericKeypad
        onDigitPress={handleDigitPress}
        onClear={handleClear}
        onBackspace={handleBackspace}
        pendingDigit={pendingDigit}
      />
    </View>
  );
}

// ---- Sub-components ----

function PlayerHeader({
  playerName,
  playerIndex,
  totalPlayers,
  onPrev,
  onNext,
  onExit,
}: {
  playerName: string;
  playerIndex: number;
  totalPlayers: number;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
}) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.headerContainer}>
      <Pressable
        style={styles.headerNavButton}
        onPress={onPrev}
        accessibilityLabel="Previous player"
      >
        <FontAwesome6
          name="chevron-left"
          iconStyle="solid"
          size={20}
          color={theme.colors.action}
        />
      </Pressable>

      <View style={styles.headerCenter}>
        <Text style={styles.headerName} numberOfLines={1}>
          {playerName}
        </Text>
        <Text style={styles.headerCount}>
          {playerIndex + 1} of {totalPlayers}
        </Text>
      </View>

      <Pressable
        style={styles.headerNavButton}
        onPress={onNext}
        accessibilityLabel="Next player"
      >
        <FontAwesome6
          name="chevron-right"
          iconStyle="solid"
          size={20}
          color={theme.colors.action}
        />
      </Pressable>

      <Pressable
        style={styles.headerExitButton}
        onPress={onExit}
        accessibilityLabel="Exit rapid entry"
      >
        <FontAwesome6
          name="xmark"
          iconStyle="solid"
          size={20}
          color={theme.colors.secondary}
        />
      </Pressable>
    </View>
  );
}

function NineHoleRow({
  holes,
  holesList,
  label,
  round,
  parMap,
  activeHole,
  pendingDigit,
  onHoleTap,
}: {
  holes: number[];
  holesList: string[];
  label: string;
  round: import("spicylib/schema").Round | null;
  parMap: Map<string, number>;
  activeHole: number;
  pendingDigit: string | null;
  onHoleTap: (hole: number) => void;
}) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.nineContainer}>
      {/* Label column */}
      <View style={styles.nineLabel}>
        <Text style={styles.nineLabelText}>{label}</Text>
      </View>

      {/* Hole cells */}
      <View style={styles.nineCells}>
        {holes.map((holeNum) => {
          const holeStr = holesList[holeNum - 1] ?? String(holeNum);
          const par = parMap.get(holeStr) ?? 4;
          const gross =
            round?.$isLoaded && round.scores?.$isLoaded
              ? getGrossScore(round, holeStr)
              : null;
          const isActive = holeNum === activeHole;
          const isPending = isActive && pendingDigit !== null;
          const scoreToPar = gross !== null ? getScoreToPar(gross, par) : null;

          return (
            <Pressable
              key={holeNum}
              style={[styles.cell, isActive && styles.cellActive]}
              onPress={() => onHoleTap(holeNum)}
            >
              <Text style={styles.cellHoleNum}>{holeNum}</Text>
              <Text style={styles.cellPar}>{par}</Text>
              <Text
                style={[
                  styles.cellScore,
                  scoreToPar !== null && {
                    color: getScoreColor(scoreToPar, theme),
                  },
                  isPending && styles.cellScorePending,
                ]}
              >
                {isPending
                  ? `${pendingDigit}_`
                  : gross !== null
                    ? String(gross)
                    : "\u2013"}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function NumericKeypad({
  onDigitPress,
  onClear,
  onBackspace,
  pendingDigit,
}: {
  onDigitPress: (digit: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  pendingDigit: string | null;
}) {
  const { theme } = useUnistyles();

  const rows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["C", "0", "\u232B"],
  ];

  return (
    <View style={styles.keypadContainer}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.keypadRow}>
          {row.map((key) => {
            const isOneKey = key === "1";
            const isPending = isOneKey && pendingDigit === "1";

            return (
              <Pressable
                key={key}
                style={[
                  styles.keypadKey,
                  isPending && styles.keypadKeyPending,
                  key === "C" && styles.keypadKeyAction,
                  key === "\u232B" && styles.keypadKeyAction,
                ]}
                onPress={() => {
                  if (key === "C") onClear();
                  else if (key === "\u232B") onBackspace();
                  else onDigitPress(key);
                }}
              >
                <Text
                  style={[
                    styles.keypadKeyText,
                    (key === "C" || key === "\u232B") && {
                      color: theme.colors.secondary,
                    },
                  ]}
                >
                  {key}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ---- Helpers ----

type Theme = ReturnType<typeof useUnistyles>["theme"];

function getScoreColor(scoreToPar: number, theme: Theme): string {
  if (scoreToPar <= -2) return theme.colors.score.eagle;
  if (scoreToPar === -1) return theme.colors.score.birdie;
  if (scoreToPar === 0) return theme.colors.score.par;
  if (scoreToPar === 1) return theme.colors.score.bogey;
  if (scoreToPar === 2) return theme.colors.score.doubleBogey;
  return theme.colors.score.tripleBogey;
}

// ---- Styles ----

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    marginBottom: theme.gap(2),
  },
  exitButton: {
    padding: theme.gap(1),
  },
  exitButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  // Player Header
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.gap(0.5),
    paddingVertical: theme.gap(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  headerNavButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerName: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  headerCount: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  headerExitButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  // Hole Grid
  gridContainer: {
    flex: 1,
    justifyContent: "center",
    padding: theme.gap(0.5),
  },
  gridLandscape: {
    flexDirection: "row",
    gap: theme.gap(1),
  },
  gridPortrait: {
    flexDirection: "column",
    gap: theme.gap(1),
  },

  // Nine-hole row
  nineContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  nineLabel: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  nineLabelText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.secondary,
  },
  nineCells: {
    flex: 1,
    flexDirection: "row",
  },

  // Individual cell
  cell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.gap(0.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    marginHorizontal: 1,
    minHeight: 60,
  },
  cellActive: {
    borderColor: theme.colors.action,
    borderWidth: 2,
    backgroundColor: `${theme.colors.action}10`,
  },
  cellHoleNum: {
    fontSize: 9,
    fontWeight: "600",
    color: theme.colors.secondary,
  },
  cellPar: {
    fontSize: 9,
    color: theme.colors.secondary,
    marginTop: 1,
  },
  cellScore: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginTop: 2,
  },
  cellScorePending: {
    opacity: 0.6,
  },

  // Numeric Keypad
  keypadContainer: {
    paddingHorizontal: theme.gap(2),
    paddingBottom: theme.gap(2),
    paddingTop: theme.gap(1),
    gap: theme.gap(0.5),
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.gap(0.5),
  },
  keypadKey: {
    flex: 1,
    maxWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.gap(1.5),
    borderRadius: 8,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  keypadKeyPending: {
    borderColor: theme.colors.action,
    borderWidth: 2,
    backgroundColor: `${theme.colors.action}10`,
  },
  keypadKeyAction: {
    backgroundColor: theme.colors.background,
  },
  keypadKeyText: {
    fontSize: 24,
    fontWeight: "600",
    color: theme.colors.primary,
  },
}));
