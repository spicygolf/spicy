'use strict';

import React from 'react';

import {
  ActivityIndicator,
  AsyncStorage,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import {
  Button,
  Card,
  Icon,
  List,
  ListItem
} from 'react-native-elements';

import { filter } from 'lodash';

import Courses from 'features/gameSetup/courses';
import Players from 'features/gameSetup/players';
import GameNav from 'features/games/gamenav';


class GameSetup extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      players: this.props.navigation.getParam('players') || [],
      currentPlayerKey: null,
      addCurrentPlayer: true,
      courses: this.props.navigation.getParam('courses') || [],
    };
    this._addCourse = this._addCourse.bind(this);
    this._removeCourse = this._removeCourse.bind(this);
    this._addPlayer = this._addPlayer.bind(this);
    this.removePlayer = this._removePlayer.bind(this);
  }

  _addCourse(coursetee) {
    this.setState(prev => {
      // TODO: check for dupes with lodash
      prev.courses.push(coursetee);
      return {
        courses: prev.courses
      };
    });
  }

  _removeCourse(item) {
    this.setState(prev => ({
      courses: filter(prev.courses, (c) => (c._key !== item._key))
    }));
  }

  _addPlayer(pkey) {
    this.setState(prev => {
      if( !prev.players.includes(pkey) ) {
        prev.players.push(pkey);
      }
      return {
        players: prev.players
      };
    });
  }

  _removePlayer(pkey) {
    this.setState(prev => ({
      players: filter(prev.players, (p) => (p !== pkey)),
      addCurrentPlayer: !(pkey == this.state.currentPlayerKey)
    }));
  }

  async componentDidMount() {
    // TODO: check nav.getParam('players') (cuz gameSetup could be entered for an
    //       existing game) and only add current user if it's a new game
    const cpkey = await AsyncStorage.getItem('currentPlayer');
    this.setState(prev => {
      prev.players.push(cpkey);
      return {
        currentPlayerKey: cpkey,
        players: prev.players
      };
    });
  }

  render() {

    let content;
    const gamespec = this.props.navigation.getParam('gamespec');

    if( gamespec ) {

      const gs = gamespec;

      const courseSection = ( gs.location_type && gs.location_type == 'local' ) ?
       (
        <Courses
         courses={this.state.courses}
         showButton={ true }
         addFn={(item) => this._addCourse(item)}
         removeFn={(item) => this._removeCourse(item)}
         navigation={this.props.navigation}
        />
      ) : null;

      const playerSection = (
        <Players
         players={this.state.players}
         showButton={ this.state.players.length < gs.max_players ||
                      gs.max_players < 0 }
         addFn={(item) => this._addPlayer(item)}
         removeFn={(item) => this._removePlayer(item)}
         addCurrentPlayer={this.state.addCurrentPlayer}
         navigation={this.props.navigation}
        />
      );

      const optionsSection = (
        <Card title="Options">
        </Card>
      );

      content = (
        <View>
          <GameNav
            title='Game Setup'
            showBack={true}
            showScore={false}
            navigation={this.props.navigation}
          />
          <View style={styles.container}>
            <View style={styles.gname}>
              <Text style={styles.name_txt}>{gs.name}</Text>
            </View>
            <ScrollView>
              { courseSection }
              { playerSection }
              { optionsSection }
            </ScrollView>
          </View>
        </View>
      );
    } else {
      content = (
        <ActivityIndicator />
      );
    }

    return content;
  }
}

export default GameSetup;


const styles = StyleSheet.create({
  container: {
    marginBottom: 100
  },
  gname: {
    alignItems: 'center'
  },
  listContainer: {
    marginTop: 0,
    marginBottom: 10
  }
});
