'use strict';

import React from 'react';

import {
  Text,
  View
} from 'react-native';

import Header from '../components/header';

import Leaderboard from '../components/leaderboard';

import { green } from '../lib/colors';

class Game extends React.Component {

  render() {

    // TODO: tabs for active, done, etc.?
    // TODO: search? scroll back thru dates, opponents?

    return (
      <View>
        <Leaderboard game={this.props.game} />
      </View>
    );
  }
};

export default Game;
