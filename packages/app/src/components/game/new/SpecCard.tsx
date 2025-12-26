import type { NavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { Animated, ScrollView, TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { GameSpec } from "spicylib/schema";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { useCreateGame } from "@/hooks";
import type { GamesNavigatorParamList } from "@/navigators/GamesNavigator";
import { Text } from "@/ui";

interface SpecCardProps {
  spec: GameSpec;
  index: number;
  pan: Animated.Value;
  boxWidth: number;
  halfBoxDistance: number;
  isFavorited?: boolean;
  onToggleFavorite?: (spec: GameSpec) => void;
}

export function SpecCard({
  spec,
  index,
  pan,
  boxWidth,
  halfBoxDistance,
  isFavorited = false,
  onToggleFavorite,
}: SpecCardProps) {
  const navigation = useNavigation<NavigationProp<GamesNavigatorParamList>>();
  const { createGame } = useCreateGame();

  const handlePlayGame = async () => {
    const game = await createGame(spec.name, [spec]);
    if (!game) return;
    navigation.navigate("Game", {
      gameId: game.$jazz.id,
      initialView: "settings",
    });
  };

  return (
    <Animated.View
      style={{
        transform: [
          {
            scale: pan.interpolate({
              inputRange: [
                (index - 1) * boxWidth - halfBoxDistance,
                index * boxWidth - halfBoxDistance,
                (index + 1) * boxWidth - halfBoxDistance,
              ],
              outputRange: [0.8, 1, 0.8],
              extrapolate: "clamp",
            }),
          },
        ],
      }}
    >
      <View
        style={[
          styles.card,
          {
            width: boxWidth,
          },
        ]}
      >
        <View style={styles.container}>
          <View style={styles.titleView}>
            <View style={styles.titleRow}>
              {onToggleFavorite && (
                <FavoriteButton
                  isFavorited={isFavorited}
                  onToggle={() => onToggleFavorite(spec)}
                  size={20}
                />
              )}
              <Text style={styles.title}>{spec.name}</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>{spec.short || ""}</Text>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            style={styles.scrollView}
          >
            <Text style={styles.description}>
              {spec.long_description ||
                `${spec.short}\n\nType: ${spec.spec_type}\nMin Players: ${spec.min_players}\nTeams: ${spec.teams ? "Yes" : "No"}`}
            </Text>
          </ScrollView>
          <TouchableOpacity style={styles.playButton} onPress={handlePlayGame}>
            <Text style={styles.playButtonText}>Play Game</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    height: "98%",
    padding: theme.gap(2),
    marginVertical: theme.gap(1),
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
  },
  container: {
    flex: 1,
  },
  titleView: {
    paddingBottom: theme.gap(0.5),
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.gap(1),
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    color: theme.colors.secondary,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: theme.gap(1),
    paddingBottom: theme.gap(1),
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
    paddingVertical: theme.gap(1),
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  playButton: {
    backgroundColor: theme.colors.action,
    paddingVertical: theme.gap(1.5),
    borderRadius: 8,
    alignItems: "center",
    marginTop: theme.gap(1),
  },
  playButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
}));
