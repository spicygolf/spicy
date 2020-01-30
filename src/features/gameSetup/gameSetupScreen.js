'use strict';

import React from 'react';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import {
  Card,
} from 'react-native-elements';

import { Query } from 'react-apollo';
import {
  GET_GAMESPEC_QUERY,
} from 'features/games/graphql';

import Players from 'features/gameSetup/players';
import { GameContext } from 'features/game/gamecontext';



class GameSetupScreen extends React.Component {

  static contextType = GameContext;

  constructor(props) {
    super(props);
    //console.log('gameSetupScreen props', props);
    this.state = {
      addCurrentPlayer: true,
      options: [],
    };
  }

  render() {

    const { game } = this.context;

    // TODO: maybe query for the gamespec earlier, like in game.js and
    //       get rid of this query here?
    return (
      <Query
        query={GET_GAMESPEC_QUERY}
        variables={{
          gamespec: game.gametype
        }}
      >
        {({data, loading, error }) => {
          if( loading ) return (<ActivityIndicator />);

          // TODO: error component instead of below...
          if( error ) {
            console.log(error);
            return (<Text>Error</Text>);
          }
          const { getGameSpec: gamespec } = data;
          const gs = gamespec;

          const playerSection = (
            <Players
              game={game}
              gamespec={gs}
              addCurrentPlayer={this.state.addCurrentPlayer}
              navigation={this.props.navigation}
            />
          );

          const optionsSection = (
            <Card title="Options">
            </Card>
          );

          return (
            <View style={styles.container}>
              <View style={styles.setupContainer}>
                <View style={styles.gname}>
                  <Text style={styles.name_txt}>{gs.name}</Text>
                </View>
                <ScrollView>
                  { playerSection }
                  { optionsSection }
                </ScrollView>
              </View>
            </View>
          );
        }}
      </Query>
    );

  }

}

export default GameSetupScreen;


const styles = StyleSheet.create({
  container: {
    height: '100%',
    marginBottom: 100
  },
  setupContainer: {
    flex: 12
  },
  gname: {
    alignItems: 'center'
  },
  listContainer: {
    marginTop: 0,
    marginBottom: 10
  }
});
