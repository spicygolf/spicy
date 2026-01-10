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
        <Text style={styles.description}>
          Tools for development and testing. These may change or be removed in
          production builds.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Specs</Text>
          <Text style={styles.sectionDescription}>
            Add or update the default game specifications from the catalog.
          </Text>
          <Button label="Add/Update Default Specs" onPress={handleAddSpecs} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.gap(2),
  },
  description: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  section: {
    gap: theme.gap(1.5),
    paddingTop: theme.gap(1),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionDescription: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
}));
