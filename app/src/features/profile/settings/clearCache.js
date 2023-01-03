import { useApolloClient } from '@apollo/client';
import { dark } from 'common/colors';
import { clearCache } from 'common/utils/account';
import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button, Card } from 'react-native-elements';

const ClearCache = (props) => {
  const [cleared, setCleared] = useState(false);
  const client = useApolloClient();

  let message = '';
  if (cleared) {
    message = 'Local Data Cleared';
  }

  return (
    <Card>
      <Text style={styles.note}>
        Press to clear local data from your device. This should not affect anything, as
        the app will re-fetch what it needs from the server.
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
  note: {
    fontSize: 14,
    margin: 10,
    color: dark,
  },
  button: {
    margin: 10,
  },
  message: {
    minHeight: 40,
    marginTop: 20,
    textAlign: 'center',
  },
});
