'use strict';

import React from 'react';
import {
  StyleSheet,
  View
} from 'react-native';
import { useApolloClient } from '@apollo/react-hooks';
import {
  Button
} from 'react-native-elements';

import { red } from 'common/colors';
import { logout } from 'common/utils/account';


const ProfileHome = props => {

  const client = useApolloClient();

  const _logoutPressed = () => {
    logout(props);
  }

  const _clearCache = props => {
    client.resetStore();
  }

  return (
    <View>
      <Button
        style={styles.logout_button}
        title='Logout'
        testID='logout_button'
        onPress={() => _logoutPressed()}
      />
      <Button
        style={styles.logout_button}
        title='Clear Cache'
        testID='clear_cache_button'
        onPress={() => _clearCache()}
      />
    </View>
  );

};

export default ProfileHome;


const styles = StyleSheet.create({
  logout_button: {
    marginTop: 10
  }
});
