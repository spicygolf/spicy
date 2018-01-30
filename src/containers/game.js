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
import { roundsPlayersSelector } from '../state/lib/selectors';


class Game extends React.Component {

  componentWillMount() {
    this.props.fetchGameRoundsPlayers(this.props.currentGame);
  }

  render() {

    var content;

    if( this.props.roundsPlayers ) {
      content = (
        <View>
          <GameNav
            title={this.props.currentGame.name}
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
}

function mapStateToProps(state) {
  return {
    roundsPlayers: roundsPlayersSelector(state),
    currentGame: state.currentGame
  };
}

export default connect(mapStateToProps)(Game);
