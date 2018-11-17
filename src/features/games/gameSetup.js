'use strict';

import React from 'react';

import {
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

import { remove } from 'lodash';

import { withApollo } from 'react-apollo';
import {
  GET_PLAYER_QUERY
} from 'features/players/graphql';

import GameNav from 'features/games/gamenav';


class GameSetup extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      players: [],
      courses: [],
    };
    this._addPlayerPressed = this._addPlayerPressed.bind(this);
    this._removePlayerPressed = this._removePlayerPressed.bind(this);
    this._renderItem = this._renderItem.bind(this);
  }

  _addCoursePressed() {
      console.log('add course pressed');
  }

  _addPlayerPressed() {
    console.log('add player pressed');
    console.log('players', this.state.players);
    console.log('max players', this.props.gamespec.max_players);
  }

  _removePlayerPressed(item) {
    this.setState(prev => {
      prev.players = remove(prev.players, (p) => (
        p._key != item._key
      ));
      console.log('removePlayer newState', prev);
      return prev;
    });
  }

  _renderItem({item}) {
    return (
      <ListItem
        title={item.name || ''}
        subtitle={item.handicap || '5.5'}
        rightIcon={{name: 'remove-circle', color: 'red'}}
        onPressRightIcon={() => this._removePlayerPressed(item)}
      />
    );
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
        this.setState(_prev => ({
          players: [
            cp.data.getPlayer
          ]
        }));
      }
    }
  }

  render() {

    var content;
    if( this.props.gamespec ) {
      const gs = this.props.gamespec;

      const courseSection = ( gs.location_type && gs.location_type == 'local' ) ?
       (
        <Card title="Course, Tees">
          <Button
            title='Add Course'
            onPress={() => this._addCoursePressed()}
          />
        </Card>
      ) : null;

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
            <Card title="Players">
                  {
                <List>
                  <FlatList
                    data={this.state.players}
                    renderItem={this._renderItem}
                    keyExtractor={item => item._key}
                  />
                </List>
              }
              <Button
                title='Add Player'
                onPress={() => this._addPlayerPressed()}
              />
            </Card>

            <Card title="Options">
            </Card>

          </View>
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

export default withApollo(GameSetup);


const styles = StyleSheet.create({
  container: {},
  gname: {
    alignItems: 'center',

  }
});
