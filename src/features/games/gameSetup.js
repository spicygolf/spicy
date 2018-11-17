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

  _addPlayerPressed() {
    console.log('add player pressed');
  }

  _removePlayerPressed(item) {
      console.log('remove player pressed', item);
  }

  _renderItem({item}) {
    return (
      <ListItem
        title={item.name || ''}
        subtitle={item.handicap || ''}
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
      content = (
        <View>
          <GameNav
            title='Game Setup'
            showBack={true}
            showScore={false} />
          <View style={styles.container}>
            <View style={styles.gname}>
              <Text style={styles.name_txt}>{this.props.gamespec.name}</Text>
            </View>

            <Card title="Course, Tees">
            </Card>

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
