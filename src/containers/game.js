'use strict';

import React from 'react';

import {
  Text,
  View
} from 'react-native';

import Header from '../components/header';
import GameNav from '../components/gamenav';
import Leaderboard from '../components/leaderboard';

import { baseUrl } from '../lib/config';

class Game extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      scores: []
    };
  }

  async _fetchScores() {
    const url = baseUrl + '/game/'+this.props.game.id+'/scores';
    try {
      let response = await fetch(url);
      let responseJson = await response.json();
      this._updateData('scores', responseJson);
    } catch(error) {
      console.error(error);
    }
  }

  _updateData(type, data) {
    this.setState((prevState, props) => {
      prevState[type] = data;
      return prevState;
    });
  }

  componentWillMount() {
    this._fetchScores();
  }

  render() {

    var content;

    if( this.state && this.state.scores ) {
      content = (
        <View>
          <GameNav
            game={this.props.game}
            scores={this.state.scores}
            back={true}
            score={true}
          />
          <Leaderboard
            game={this.props.game}
            scores={this.state.scores}
          />
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

export default Game;
