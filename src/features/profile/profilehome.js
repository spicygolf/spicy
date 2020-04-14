'use strict';

import React, { useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useApolloClient } from '@apollo/client';
import {
  Card,
  Button
} from 'react-native-elements';

import { red } from 'common/colors';
import { logout } from 'common/utils/account';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';



const ProfileHome = props => {

  const client = useApolloClient();
  const { currentPlayer } = useContext(CurrentPlayerContext);

  const _logoutPressed = () => {
    logout(client);
  }

/*
  const _clearCache = props => {
    client.resetStore();
  }

      <Button
        style={styles.logout_button}
        title='Clear Cache'
        testID='clear_cache_button'
        onPress={() => _clearCache()}
      />
*/
  return (
    <Card>
      <View style={styles.field_view}>
        <Text>Name:</Text>
        <Text>{currentPlayer.name}</Text>
      </View>
      <View style={styles.field_view}>
        <Text>Current Index:</Text>
        <Text>{currentPlayer.handicap.index || null}</Text>
      </View>
      <View style={styles.button_view}>
        <Button
          style={styles.logout_button}
          title='Logout'
          testID='logout_button'
          onPress={() => _logoutPressed()}
        />
      </View>
    </Card>
  );

};

export default ProfileHome;


const styles = StyleSheet.create({
  field_view: {
    marginVertical: 10,
  },
  button_view: {
    marginTop: 40,
  },
  logout_button: {
    margin: 20
  },
});
