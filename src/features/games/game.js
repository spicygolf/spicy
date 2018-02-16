'use strict';

import React from 'react';

import {
  Text,
  View
} from 'react-native';

import { connect } from 'react-redux';

import Header from 'common/components/header';
import GameNav from 'features/games/gamenav';
import Leaderboard from 'features/games/leaderboard';

import { baseUrl } from 'common/config';
import { selectRoundsPlayers } from 'features/rounds/roundSelectors';


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
    roundsPlayers: selectRoundsPlayers(state),
    currentGame: state.currentGame
  };
}

export default connect(mapStateToProps)(Game);
