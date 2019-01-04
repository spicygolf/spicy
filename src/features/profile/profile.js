'use strict';

import React from 'react';
import {
  StyleSheet,
  View
} from 'react-native';
import { withApollo } from 'react-apollo';
import {
  Button
} from 'react-native-elements';

import Header from 'common/components/header';
import { red } from 'common/colors';
import { logout } from 'common/utils/auth';


class Profile extends React.Component {

  _logoutPressed() {
    logout(this.props);
  }

  render() {
    //console.log('profile client', this.props.client);
    return (
      <View>
        <Header title='Profile' color={red} />
        <Button
          style={styles.logout_button}
          title='Logout'
          testID='logout_button'
          onPress={() => this._logoutPressed()}
        />
      </View>
    );
  }
};

export default withApollo(Profile);


const styles = StyleSheet.create({
  logout_button: {
    marginTop: 10
  }
});
