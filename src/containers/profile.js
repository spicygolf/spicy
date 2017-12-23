'use strict';

import React from 'react';

import {
  View
} from 'react-native';

import Header from '../components/header';

import { red } from '../lib/colors';

class Profile extends React.Component {

  render() {
    return (
      <View>
        <Header title='Profile' color={red} />
      </View>
    );
  }
};

export default Profile;
