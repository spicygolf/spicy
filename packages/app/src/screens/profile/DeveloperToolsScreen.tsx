import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useAddGameSpecs } from "@/hooks/useAddGameSpecs";
import { Button, Screen, Text } from "@/ui";

export function DeveloperToolsScreen() {
  const { addGameSpecs } = useAddGameSpecs();

  const handleAddSpecs = () => {
    addGameSpecs(false);
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Developer Tools</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Specs</Text>

          <Button label="Add/Update Default Specs" onPress={handleAddSpecs} />
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
  spacer: {
    height: theme.gap(1.5),
  },
}));
