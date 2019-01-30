'use strict';

import React from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { goBack, navigate } from 'common/components/navigationService';


class GameNav extends React.Component {

  render() {
    const back = this.props.backTo ?
      () => navigate(this.props.backTo) :
      () => goBack();

    const left = this.props.showBack ? (
      <TouchableOpacity
        onPress={() => back()}
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
      <View style={styles.container}>
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
      </View>
    );
  }

}

export default GameNav;


const styles = StyleSheet.create({
  container: {
    flex: -1,
    minHeight: 50
  },
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
