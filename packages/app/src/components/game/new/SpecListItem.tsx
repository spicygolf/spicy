import type { NavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { GameSpec } from "spicylib/schema";
import { useCreateGame } from "@/hooks";
import type { GamesNavigatorParamList } from "@/navigators/GamesNavigator";
import { Text } from "@/ui";

export function SpecListItem({ spec }: { spec: GameSpec | null }) {
  const navigation = useNavigation<NavigationProp<GamesNavigatorParamList>>();
  const { createGame } = useCreateGame();
  if (!spec) return null;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={async () => {
          const game = await createGame(spec.name, [spec]);
          if (!game) return;
          navigation.navigate("Game", {
            gameId: game.$jazz.id,
            screen: "GameSettingsNavigator",
            params: {
              screen: "GameSettings",
            },
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
  },
  specContainer: {
    flex: 10,
    flexDirection: "column",
    marginVertical: 2,
  },
  specName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  specSub: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
}));
