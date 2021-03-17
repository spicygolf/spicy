import React, { useContext, } from 'react';
import {
  StyleSheet,
  Text,
} from 'react-native';
import {
  Button,
  Card,
} from 'react-native-elements';
import { useApolloClient } from '@apollo/client';

import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { logout } from 'common/utils/account';
import { dark } from 'common/colors';



const Logout = props => {

  const {
    setCurrentPlayer,
    setCurrentPlayerKey,
    setToken,
  } = useContext(CurrentPlayerContext);

  const client = useApolloClient();

  return (
    <Card>
      <Text style={styles.note}>Press to log out of the application</Text>
      <Button
        title='Logout'
        buttonStyle={styles.button}
        onPress={() => {
          setCurrentPlayer(null);
          setCurrentPlayerKey(null);
          setToken(null);
          logout(client);
        }}
      />
    </Card>
  );
};

export default Logout;


const styles = StyleSheet.create({
  note: {
    fontSize: 14,
    margin: 10,
    color: dark,
  },
  button: {
    margin: 10,
  },
});
