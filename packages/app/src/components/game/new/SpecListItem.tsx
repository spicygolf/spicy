import type { NavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { GameSpec } from "spicylib/schema";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { useCreateGame } from "@/hooks";
import type { GamesNavigatorParamList } from "@/navigators/GamesNavigator";
import { Text } from "@/ui";

interface SpecListItemProps {
  spec: GameSpec | null;
  isFavorited?: boolean;
  onToggleFavorite?: (spec: GameSpec) => void;
  showFavoriteButton?: boolean;
}

export function SpecListItem({
  spec,
  isFavorited = false,
  onToggleFavorite,
  showFavoriteButton = false,
}: SpecListItemProps) {
  const navigation = useNavigation<NavigationProp<GamesNavigatorParamList>>();
  const { createGame } = useCreateGame();
  if (!spec?.$isLoaded) return null;

  return (
    <View style={styles.row}>
      {showFavoriteButton && (
        <View style={styles.favoriteContainer}>
          <FavoriteButton
            isFavorited={isFavorited}
            onToggle={() => onToggleFavorite?.(spec)}
            size={20}
          />
        </View>
      )}
      <Pressable
        style={styles.pressable}
        testID={`spec-${spec.name.toLowerCase().replace(/\s+/g, "-")}`}
        accessibilityLabel={spec.name}
        onPress={async () => {
          const game = await createGame(spec.name, [spec]);
          if (!game) return;
          navigation.navigate("Game", {
            gameId: game.$jazz.id,
            initialView: "settings",
          });
        }}
      >
        <View style={styles.specContainer}>
          <Text style={styles.specName}>{spec.name}</Text>
          <Text style={styles.specSub}>
            {spec.spec_type} - {spec.short}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1),
  },
  favoriteContainer: {
    marginRight: theme.gap(1.5),
  },
  pressable: {
    flex: 1,
  },
  specContainer: {
    flexDirection: "column",
  },
  specName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  specSub: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: theme.gap(0.5),
  },
}));
