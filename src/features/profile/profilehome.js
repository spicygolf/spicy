'use strict';

import React, { useContext } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useApolloClient } from '@apollo/client';
import {
  Card,
  Button
} from 'react-native-elements';
import DeviceInfo from 'react-native-device-info';

import { red } from 'common/colors';
import { logout } from 'common/utils/account';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import Impersonate from 'features/profile/impersonate';



const ProfileHome = props => {

  const client = useApolloClient();
  const { currentPlayer } = useContext(CurrentPlayerContext);

  const _logoutPressed = () => {
    logout(client);
  }

  const name = (
    currentPlayer &&
    currentPlayer.name
  ) ? currentPlayer.name : '';

  const index = (
    currentPlayer &&
    currentPlayer.handicap &&
    currentPlayer.handicap.index
  ) ? currentPlayer.handicap.index : '-';
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

  const version = DeviceInfo.getVersion();

  const impersonate = (currentPlayer && currentPlayer.level && currentPlayer.level == 'admin' ) ? (<Impersonate />) : null;

  return (
    <ScrollView>
      <Card>
        <View style={styles.field_view}>
          <Text>Name:</Text>
          <Text>{name}</Text>
        </View>
        <View style={styles.field_view}>
          <Text>Current Index:</Text>
          <Text>{index}</Text>
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
      { impersonate }
      <View style={styles.app_info}>
        <Text>v{version}</Text>
      </View>
    </ScrollView>
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
  app_info: {
    marginHorizontal: 15,
    marginVertical: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
