'use strict';

import React from 'react';

import {
  AsyncStorage,
  Image,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { withApollo } from 'react-apollo';
import {
  GET_PLAYER_QUERY
} from 'features/players/graphql';

import { Button, Card } from 'react-native-elements';

import GameNav from 'features/games/gamenav';


class GameSetup extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      players: [],
      courses: [],
    };
  }

  _addPlayerPressed() {
    console.log('add player pressed');
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

            <Card title="Players, Course, Tees">
              {
                this.state.players.map((p, i) => {
                  return (
                    <View key={i} style={styles.player}>
                      <Image
                        style={styles.image}
                        resizeMode="cover"
                        source={{ uri: p.avatar }}
                      />
                      <Text style={styles.pname}>{p.name}</Text>
                    </View>
                  );
                })
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
