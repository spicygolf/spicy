/**
 * Manual player entry screen for adding players without GHIN accounts.
 *
 * Creates a player with handicap.source = "manual". Jazz automatically tracks
 * $jazz.createdAt and $jazz.createdBy for future account merge functionality.
 */

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { HandicapIndexInput } from "@/components/common/HandicapIndexInput";
import { type PlayerData, useAddPlayerToGame } from "@/hooks";
import type { GameSettingsStackParamList } from "@/screens/game/settings/GameSettings";
import { Button, Picker, Screen, Text, TextInput } from "@/ui";

type NavigationProp = NativeStackNavigationProp<GameSettingsStackParamList>;

const GENDER_OPTIONS = [
  { label: "Male", value: "M" },
  { label: "Female", value: "F" },
];

export function AddPlayerManual(): React.ReactElement {
  const navigation = useNavigation<NavigationProp>();
  const addPlayerToGame = useAddPlayerToGame();

  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [handicapIndex, setHandicapIndex] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!shortName.trim()) {
      newErrors.shortName = "Short name is required";
    }
    if (handicapIndex.trim()) {
      const hcpValue = Number.parseFloat(handicapIndex.replace(/^\+/, ""));
      if (Number.isNaN(hcpValue) || hcpValue < 0 || hcpValue > 54) {
        newErrors.handicapIndex = "Handicap must be between 0 and 54";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, shortName, handicapIndex]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!validate()) return;

    setIsSubmitting(true);

    // Build PlayerData - no ghinId for manual players
    const playerData: PlayerData = {
      name: name.trim(),
      short: shortName.trim(),
      gender,
      // No ghinId for manual players - Jazz tracks $jazz.createdBy automatically
      handicap: handicapIndex.trim()
        ? {
            source: "manual",
            display: handicapIndex.trim(),
            value: Number.parseFloat(handicapIndex.replace(/^\+/, "")),
            revDate: new Date(),
          }
        : undefined,
    };

    const result = await addPlayerToGame(playerData);

    setIsSubmitting(false);

    if (result.isOk()) {
      const { player, roundAutoCreated } = result.value;
      if (!roundAutoCreated) {
        // Need to select or create a round
        navigation.navigate("AddRoundToGame", { playerId: player.$jazz.id });
      } else {
        // Round was auto-created, clear form for adding more players
        setName("");
        setShortName("");
        setGender("M");
        setHandicapIndex("");
        setErrors({});
      }
    } else {
      Alert.alert("Error", result.error.message);
    }
  }, [
    validate,
    name,
    shortName,
    gender,
    handicapIndex,
    addPlayerToGame,
    navigation,
  ]);

  const isValid = name.trim() && shortName.trim();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            autoCapitalize="words"
            hasError={!!errors.name}
          />
          {errors.name ? (
            <Text style={styles.errorText}>{errors.name}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Short Name</Text>
          <TextInput
            value={shortName}
            onChangeText={setShortName}
            placeholder="Nickname for scorecard"
            autoCapitalize="words"
            hasError={!!errors.shortName}
          />
          {errors.shortName ? (
            <Text style={styles.errorText}>{errors.shortName}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Gender</Text>
          <Picker
            title="Select gender"
            items={GENDER_OPTIONS}
            selectedValue={gender}
            onValueChange={(value) => setGender(value as "M" | "F")}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Handicap Index (optional)</Text>
          <HandicapIndexInput
            value={handicapIndex}
            onChangeText={setHandicapIndex}
            error={errors.handicapIndex}
            helperText="You can override the game handicap later in game settings."
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            label={isSubmitting ? "Adding..." : "Add Player"}
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scrollContent: {
    padding: theme.gap(2),
  },
  field: {
    marginBottom: theme.gap(2),
  },
  label: {
    color: theme.colors.secondary,
    fontSize: 12,
    marginBottom: theme.gap(0.5),
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: theme.gap(0.5),
  },
  buttonContainer: {
    marginTop: theme.gap(2),
  },
}));
