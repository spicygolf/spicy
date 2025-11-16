import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import type { NavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { TouchableOpacity } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { ProfileNavigatorParamList } from "@/navigators/ProfileNavigator";
import { Text } from "@/ui";

export function DeveloperTools() {
  const navigation = useNavigation<NavigationProp<ProfileNavigatorParamList>>();
  const { theme } = useUnistyles();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate("DeveloperToolsScreen")}
    >
      <Text style={styles.title}>Developer Tools</Text>
      <FontAwesome6
        name="chevron-right"
        iconStyle="solid"
        size={16}
        color={theme.colors.secondary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.gap(2),
    paddingVertical: theme.gap(1),
  },
  title: {
    fontWeight: "bold",
  },
}));
