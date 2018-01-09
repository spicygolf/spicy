'use strict';

import React from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import {
  Actions
} from 'react-native-router-flux';

import Icon from '@expo/vector-icons/MaterialCommunityIcons';

import Header from '../components/header';

import Leaderboard from '../components/leaderboard';

import { green } from '../lib/colors';
import { baseUrl } from '../lib/config';

const styles = StyleSheet.create({
  GameNav: {
    flex: 3,
    flexDirection: 'row',
    minHeight: 50,
    padding: 5
  },
  left: {
    flex: 1,
    justifyContent: 'center'
  },
  right: {
    flex: 1,
    justifyContent: 'center'
  },
  middle: {
    flex: 5,
    justifyContent: 'center'
  },
  title: {
    fontSize: 18,
    textAlign: 'center'
  }
});

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
          <View style={styles.GameNav}>
            <View style={styles.left}>
              <TouchableOpacity
                onPress={Actions.pop}
              >
                <Icon name='chevron-left' size={30} color='#bbb' />
              </TouchableOpacity>
            </View>
            <View style={styles.middle}>
              <Text style={styles.title}>{this.props.game.name}</Text>
            </View>
            <View style={styles.right}>
              <TouchableOpacity
                onPress={() => Actions.score({
                    game: this.props.game
                  })}
              >
                <Icon name='lead-pencil' size={30} color='#666' />
              </TouchableOpacity>
            </View>
          </View>
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
