'use strict';

import React from 'react';

import {
  Text,
  View
} from 'react-native';

import {
  Actions
} from 'react-native-router-flux';

import Header from '../components/header';
import GameNav from '../components/gamenav';


class Score extends React.Component {

  render() {

    return (
      <View>
        <GameNav
          title={this.props.player.name}
          showBack={true}
          showScore={false}
        />
        <Text>{this.props.round}</Text>
      </View>
    );
  }
};

export default Score;
