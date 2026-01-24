import { useApolloClient } from "@apollo/client";
import SpicySearchPlayer from "common/components/spicy/player/search";
import { clearCache } from "common/utils/account";
import { CurrentPlayerContext } from "features/players/currentPlayerContext";
import { useContext, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, Card } from "react-native-elements";

const Impersonate = (_props) => {
  const client = useApolloClient();

  const defaultNewPlayer = {
    search: "",
  };

  const [newPlayer, setNewPlayer] = useState(defaultNewPlayer);

  const { currentPlayer, setCurrentPlayerKey, impersonate, setImpersonate } =
    useContext(CurrentPlayerContext);
  // console.log('CurrentPlayerContext', useContext(CurrentPlayerContext));

  const impersonatePlayer = (iPlayer) => {
    console.log("impersonate", iPlayer);
    clearCache(client);
    setCurrentPlayerKey(iPlayer);
  };

  let content;
  if (impersonate?.original) {
    content = (
      <View>
        <Card>
          <Text style={styles.field_label}>
            Impersonating {currentPlayer.name}
          </Text>
          <Button
            title="Stop"
            buttonStyle={styles.button}
            onPress={() => {
              // console.log('stop impersonating');
              setImpersonate(null);
              impersonatePlayer(impersonate.original._key);
            }}
          />
        </Card>
      </View>
    );
  } else {
    content = (
      <KeyboardAvoidingView>
        <ScrollView keyboardShouldPersistTaps="handled">
          <Card>
            <Text style={styles.field_label}>Player to Impersonate:</Text>
            <SpicySearchPlayer
              state={newPlayer}
              setState={setNewPlayer}
              onPress={(item) => {
                // console.log('player pressed', item);
                setImpersonate({
                  original: currentPlayer,
                  impersonating: item._key,
                });
                impersonatePlayer(item._key);
              }}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
  return content;
};

export default Impersonate;

const styles = StyleSheet.create({
  button: {
    backgroundColor: "red",
    margin: 10,
  },
  field_input: {
    borderColor: "#ccc",
    borderWidth: 1,
    color: "#000",
    height: 40,
    marginBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
  },
  field_label: {
    fontWeight: "bold",
    margin: 5,
  },
});
