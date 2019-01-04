'use strict';

import React from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';



class GameNav extends React.Component {

  render() {
    const left = this.props.showBack ? (
      <TouchableOpacity
        onPress={() => this.props.navigation.goBack()}
      >
        <Icon name='chevron-left' size={30} color='#bbb' />
      </TouchableOpacity>
    ) : <Text></Text>;

    const right = this.props.showScore ? (
      <TouchableOpacity
        onPress={() => this.props.navigation.navigate('Score', {
            game   : this.props.game,
            scores : this.props.scores
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
          <Text style={styles.title}>{this.props.title}</Text>
        </View>
        <View style={styles.right}>
          {right}
        </View>
      </View>
    );
  }

}

export default GameNav;


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
