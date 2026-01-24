import AddPlayerTabs from "features/gameSetup/addPlayerTabs";
import GameNav from "features/games/gamenav";
import { StyleSheet, View } from "react-native";

const AddPlayer = (_props) => {
  return (
    <View style={styles.container}>
      <GameNav title="Add Player" showBack={true} backTo={"GameSetup"} />
      <AddPlayerTabs />
    </View>
  );
};

export default AddPlayer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
