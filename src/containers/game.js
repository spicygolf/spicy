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

import Icon from '@expo/vector-icons/MaterialIcons';

import Header from '../components/header';

import Leaderboard from '../components/leaderboard';

import { green } from '../lib/colors';

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

  render() {

    return (
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
          </View>
        </View>
        <Leaderboard game={this.props.game} />
      </View>
    );
  }
};

export default Game;
