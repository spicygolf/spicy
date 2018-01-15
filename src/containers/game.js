'use strict';

import React from 'react';

import {
  Text,
  View
} from 'react-native';

import { connect } from 'react-redux';

import Header from '../components/header';
import GameNav from '../components/gamenav';
import Leaderboard from '../components/leaderboard';

import { baseUrl } from '../lib/config';

class Game extends React.Component {

  componentWillMount() {
    this.props.fetchGameScores(this.props.game);
  }

  render() {

    var content;

    if( this.props.gameScores ) {
      content = (
        <View>
          <GameNav
            title={this.props.game.name}
            showBack={true}
            showScore={false}
          />
          <Leaderboard {...this.props} />
        </View>
      );
    } else {
      content = (
        <Text>Loading...</Text>
      );
    }

    return (
      <View>
        {content}
      </View>
    );

  }
};

function mapStateToProps(state) {
  return {
    gameScores: state.gameScores
  };
}

export default connect(mapStateToProps)(Game);
