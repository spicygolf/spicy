'use strict';

import React from 'react';

import {
  ActivityIndicator,
  AsyncStorage,
  FlatList,
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

import { withApollo } from 'react-apollo';
import {
  GET_PLAYER_QUERY
} from 'features/players/graphql';

import ItemCard from 'features/gameSetup/itemcard';
import GameNav from 'features/games/gamenav';


class GameSetup extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      players: [],
      courses: [
        {_key: '1', name: 'Druid Hills Golf Club', tee: 'Presidents'}
      ],
    };
    this._addCourse = this._addCourse.bind(this);
    this._removeCourse = this._removeCourse.bind(this);
    this._addPlayer = this._addPlayer.bind(this);
    this.removePlayer = this._removePlayer.bind(this);
  }

  _addCourse(item) {
    this.setState(prev => ({
      courses: prev.courses.push(item)
    }));
  }

  _removeCourse(item) {
    this.setState(prev => ({
      courses: filter(prev.courses, (c) => (c._key !== item._key))
    }));
  }

  _addPlayer(item) {
    this.setState(prev => ({
      players: prev.players.push(item)
    }));
  }

  _removePlayer(item) {
    this.setState(prev => ({
      players: filter(prev.players, (p) => (p._key !== item._key))
    }));
  }

  async componentDidMount() {

    // if players is blank (new game getting set up), then add the
    // current logged in player
    if( this.state.players.length == 0 ) {

      const cpkey = await AsyncStorage.getItem('currentPlayer');

      const cp = await this.props.client.query({
        query: GET_PLAYER_QUERY,
        variables: {
          player: cpkey
        }
      });

      if( cp && cp.data && cp.data.getPlayer ) {
        // ugh, first we have to flatten the player object a bit
        // so we can have shared code in itemcard
        const handicap = cp.data.getPlayer.handicap.display || 'no handicap';
        const player = {
          _key: cp.data.getPlayer._key,
          name: cp.data.getPlayer.name,
          short: cp.data.getPlayer.short,
          handicap: handicap
        };
        this.setState(_prev => ({
          players: [
            player
          ]
        }));
      }
    }
  }

  render() {

    let content;
    if( this.props.gamespec ) {

      const gs = this.props.gamespec;

      const courseSection = ( gs.location_type && gs.location_type == 'local' ) ?
       (
        <ItemCard
         title="Course, Tees"
         addButtonTitle='Add Course'
         addKey='add_course'
         items={this.state.courses}
         showButton={ true }
         itemTitleField='name'
         itemSubTitleField='tee'
         addFn={(item) => this._addCourse(item)}
         removeFn={(item) => this._removeCourse(item)}
         itemComponent='course_tee_item'
        />
      ) : null;

      const playerSection = (
        <ItemCard
         title="Players"
         addButtonTitle='Add Player'
         addKey='add_player'
         items={this.state.players}
         showButton={ this.state.players.length <= gs.max_players || gs.max_players < 0 }
         itemTitleField='name'
         itemSubTitleField='handicap'
         addFn={(item) => this._addPlayer(item)}
         removeFn={(item) => this._removePlayer(item)}
         itemComponent='player_item'
        />
      );

      content = (
        <View>
          <GameNav
            title='Game Setup'
            showBack={true}
            showScore={false} />
          <View style={styles.container}>
            <View style={styles.gname}>
              <Text style={styles.name_txt}>{gs.name}</Text>
            </View>
            { courseSection }
            { playerSection }
            <Card title="Options">
            </Card>

          </View>
        </View>
      );
    } else {
      content = (
        <ActivityIndicator />
      );
    }

    return (
      <View>
        {content}
      </View>
    );

  }
}

export default withApollo(GameSetup);


const styles = StyleSheet.create({
  container: {},
  gname: {
    alignItems: 'center'
  },
  listContainer: {
    marginTop: 0,
    marginBottom: 10
  }
});
