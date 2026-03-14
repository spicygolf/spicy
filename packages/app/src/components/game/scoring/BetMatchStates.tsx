import { View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { BetMatchState } from "spicylib/scoring";
import { Text } from "@/ui";

interface BetMatchStatesProps {
  /** Per-bet match states for this team/player */
  betStates: BetMatchState[];
}

/**
 * Displays match state for each active bet, grouped by parent.
 *
 * Base bets (Front, Back, Overall/Match) appear as top-level rows.
 * Press bets appear indented underneath their parent bet.
 * Each row shows: label, match state (up/dn/tied), and dollar amount.
 */
export function BetMatchStates({
  betStates,
}: BetMatchStatesProps): React.JSX.Element | null {
  const { theme } = useUnistyles();

  if (betStates.length === 0) return null;

  // Group: base bets first, then presses grouped under their parent
  const baseBets = betStates.filter((b) => !b.parentBetName);
  const pressByParent = new Map<string, BetMatchState[]>();

  for (const bet of betStates) {
    if (!bet.parentBetName) continue;
    const existing = pressByParent.get(bet.parentBetName) ?? [];
    existing.push(bet);
    pressByParent.set(bet.parentBetName, existing);
  }

  return (
    <View style={styles.container}>
      {baseBets.map((base) => {
        const presses = pressByParent.get(base.betName) ?? [];
        return (
          <View key={base.betName}>
            <BetRow bet={base} isPress={false} theme={theme} />
            {presses.map((press) => (
              <BetRow
                key={press.betName}
                bet={press}
                isPress={true}
                theme={theme}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

interface BetRowProps {
  bet: BetMatchState;
  isPress: boolean;
  theme: ReturnType<typeof useUnistyles>["theme"];
}

function BetRow({ bet, isPress, theme }: BetRowProps): React.JSX.Element {
  const clinched = bet.clinched === true;
  const won = clinched && bet.diff > 0;
  const lost = clinched && bet.diff < 0;
  const stateText =
    clinched && bet.clinchLabel ? bet.clinchLabel : formatDiff(bet.diff);
  const stateColor = clinched
    ? theme.colors.secondary
    : bet.diff > 0
      ? theme.colors.action
      : bet.diff < 0
        ? theme.colors.error
        : theme.colors.secondary;

  return (
    <View style={[styles.row, isPress && styles.pressRow]}>
      <Text
        style={[
          styles.label,
          isPress && styles.pressLabel,
          clinched && styles.clinched,
        ]}
      >
        {bet.betDisp}:
      </Text>
      <Text
        style={[
          styles.state,
          { color: stateColor },
          clinched && styles.clinched,
        ]}
      >
        {stateText}
      </Text>
      {bet.amount != null && (
        <Text
          style={[
            styles.amount,
            won && styles.amountWon,
            lost && styles.amountLost,
          ]}
        >
          ${bet.amount}
        </Text>
      )}
    </View>
  );
}

function formatDiff(diff: number): string {
  if (diff === 0) return "tied";
  const abs = Math.abs(diff);
  return diff > 0 ? `${abs} up` : `${abs} dn`;
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.gap(0.25),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(0.5),
  },
  pressRow: {
    paddingLeft: theme.gap(1),
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.secondary,
  },
  pressLabel: {
    fontWeight: "400",
  },
  state: {
    fontSize: 11,
    fontWeight: "600",
  },
  amount: {
    fontSize: 11,
    color: theme.colors.secondary,
    opacity: 0.6,
  },
  clinched: {
    opacity: 0.5,
  },
  amountWon: {
    color: theme.colors.action,
    fontWeight: "700",
    opacity: 1,
  },
  amountLost: {
    color: theme.colors.error,
    fontWeight: "700",
    opacity: 1,
  },
}));
