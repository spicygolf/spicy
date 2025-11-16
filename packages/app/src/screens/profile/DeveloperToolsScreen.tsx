import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useAddGameSpecs } from "@/hooks/useAddGameSpecs";
import { useCheckSpecs } from "@/hooks/useCheckSpecs";
import { Screen, Text } from "@/ui";

export function DeveloperToolsScreen() {
  const { addGameSpecs } = useAddGameSpecs();
  const { checkSpecs } = useCheckSpecs();

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Developer Tools</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Specs</Text>

          <TouchableOpacity onPress={checkSpecs} style={styles.button}>
            <Text style={styles.buttonText}>Check Specs</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={addGameSpecs} style={styles.button}>
            <Text style={styles.buttonText}>Add Default Specs</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    padding: theme.gap(2),
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: theme.gap(3),
  },
  section: {
    marginBottom: theme.gap(3),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: theme.gap(2),
  },
  button: {
    backgroundColor: theme.colors.action,
    padding: theme.gap(2),
    borderRadius: 8,
    marginBottom: theme.gap(1.5),
    alignItems: "center",
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
}));
