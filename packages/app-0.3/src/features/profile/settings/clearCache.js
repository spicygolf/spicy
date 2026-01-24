import { useApolloClient } from "@apollo/client";
import { dark } from "common/colors";
import { clearCache } from "common/utils/account";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Button, Card } from "react-native-elements";

const ClearCache = (_props) => {
  const [cleared, setCleared] = useState(false);
  const client = useApolloClient();

  let message = "";
  if (cleared) {
    message = "Local Data Cleared";
  }

  return (
    <Card>
      <Text style={styles.note}>
        Press to clear local data from your device. This should not affect
        anything, as the app will re-fetch what it needs from the server.
      </Text>
      <Button
        title="Clear Local Data"
        buttonStyle={styles.button}
        onPress={async () => {
          const res = await clearCache(client);
          if (res) {
            setCleared(true);
          }
        }}
      />
      <Text style={styles.message}>{message}</Text>
    </Card>
  );
};

export default ClearCache;

const styles = StyleSheet.create({
  button: {
    margin: 10,
  },
  message: {
    marginTop: 20,
    minHeight: 40,
    textAlign: "center",
  },
  note: {
    color: dark,
    fontSize: 14,
    margin: 10,
  },
});
