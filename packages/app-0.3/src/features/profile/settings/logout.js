import { useApolloClient } from "@apollo/client";
import { dark } from "common/colors";
import { logout } from "common/utils/account";
import { CurrentPlayerContext } from "features/players/currentPlayerContext";
import { useContext } from "react";
import { StyleSheet, Text } from "react-native";
import { Button, Card } from "react-native-elements";

const Logout = (_props) => {
  const { setCurrentPlayer } = useContext(CurrentPlayerContext);

  const client = useApolloClient();

  return (
    <Card>
      <Text style={styles.note}>Press to log out of the application</Text>
      <Button
        title="Logout"
        buttonStyle={styles.button}
        onPress={() => {
          setCurrentPlayer(null);
          logout(client);
        }}
      />
    </Card>
  );
};

export default Logout;

const styles = StyleSheet.create({
  button: {
    margin: 10,
  },
  note: {
    color: dark,
    fontSize: 14,
    margin: 10,
  },
});
