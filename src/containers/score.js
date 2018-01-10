'use strict';

import React from 'react';

import {
  Text,
  View
} from 'react-native';

import {
  Actions
} from 'react-native-router-flux';

import Icon from '@expo/vector-icons/MaterialIcons';

import Header from '../components/header';
import GameNav from '../components/gamenav';


class Score extends React.Component {

  render() {

//    console.log(this.props.game);
//    console.log(this.props.scores);

    return (
      <View>
        <GameNav
          game={this.props.game}
          scores={this.props.scores}
          back={true}
          score={false}
        />
        <Text>Score</Text>
      </View>
    );
  }
};

export default Score;
