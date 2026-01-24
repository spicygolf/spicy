import Admin from "features/gameSetup/admin";
import Options from "features/gameSetup/options";
import Players from "features/gameSetup/players";
import Teams from "features/gameSetup/teams";
import { KeyboardAvoidingView, ScrollView, StyleSheet } from "react-native";

const GameSetupScreen = (_props) => {
  return (
    <KeyboardAvoidingView style={styles.container} testID="game_setup_kaview">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        testID="game_setup_scrollview"
      >
        <Players />
        <Teams />
        <Options />
        <Admin />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default GameSetupScreen;

const styles = StyleSheet.create({
  container: {
    height: "100%",
    paddingBottom: 10,
  },
});
