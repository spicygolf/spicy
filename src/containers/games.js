'use strict';

import React from 'react';

import {
  View
} from 'react-native';

import Header from '../components/header';

import { green } from '../lib/colors';

class Games extends React.Component {

  render() {
    return (
      <View>
        <Header title='Games' color={green} />
      </View>
    );
  }
};

export default Games;
