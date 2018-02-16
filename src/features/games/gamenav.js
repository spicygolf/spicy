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

const GameNav = (
  {
    title,
    scores,
    showBack,
    showScore
  }) => {

    var left = showBack ? (
      <TouchableOpacity
        onPress={Actions.pop}
      >
        <Icon name='chevron-left' size={30} color='#bbb' />
      </TouchableOpacity>
    ) : <Text></Text>;

    var right = showScore ? (
      <TouchableOpacity
        onPress={() => Actions.score({
            game   : game,
            scores : scores
          })}
      >
        <Icon name='lead-pencil' size={30} color='#666' />
      </TouchableOpacity>
    ) : <Text></Text>;

    return (
      <View style={styles.GameNav}>
        <View style={styles.left}>
          {left}
        </View>
        <View style={styles.middle}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.right}>
          {right}
        </View>
      </View>
    );
  };

export default GameNav;
