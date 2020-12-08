'use strict';

import React, { useContext } from 'react';
import {
  KeyboardAvoidingView,
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
  const {
    currentPlayer,
    setCurrentPlayer,
    setCurrentPlayerKey,
    setToken,
  } = useContext(CurrentPlayerContext);

  const _logoutPressed = () => {
    setCurrentPlayer(null);
    setCurrentPlayerKey(null);
    setToken(null);
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

  const _clearCache = props => {
    for( const key of Object.keys(client.cache.data.data) ) {
      client.cache.evict(key);
    }
    client.cache.gc();
    console.log('cache', client.cache.data.data);
  }

  const version = DeviceInfo.getVersion();

  const impersonate = (currentPlayer && currentPlayer.level && currentPlayer.level == 'admin' ) ? (<Impersonate />) : null;

  return (
    <KeyboardAvoidingView style={{flex: 1,}}>
      <ScrollView keyboardShouldPersistTaps='handled'>
        <Card>
          <View style={styles.field_view}>
            <Text>Name:</Text>
            <Text>{name}</Text>
          </View>
          <View style={styles.field_view}>
            <Text>Current Index:</Text>
            <Text>{index}</Text>
          </View>
          <Button
            buttonStyle={styles.button}
            title='Clear Local Data'
            testID='clear_cache_button'
            onPress={() => _clearCache()}
          />
          <Button
            buttonStyle={styles.button}
            title='Logout'
            testID='logout_button'
            onPress={() => _logoutPressed()}
          />
        </Card>
        { impersonate }
      </ScrollView>
      <View style={styles.app_info}>
          <Text>v{version}</Text>
        </View>
    </KeyboardAvoidingView>
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
  button: {
    margin: 10,
  },
  app_info: {
    marginHorizontal: 15,
    marginVertical: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
