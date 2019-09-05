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
  Button,
  Card,
  ListItem
} from 'react-native-elements';

import { Query } from 'react-apollo';
import {
  GET_GAMESPEC_QUERY,
} from 'features/games/graphql';
import { navigate } from 'common/components/navigationService';

import Courses from 'features/gameSetup/courses';
import Players from 'features/gameSetup/players';
import GameNav from 'features/games/gamenav';

import { green } from 'common/colors';



class GameSetupScreen extends React.Component {

  constructor(props) {
    super(props);
    //console.log('gameSetupScreen props', props);
    const sp = this.props.screenProps;
    this.state = {
      gkey: sp.gkey,
      gametype: sp.gametype,
      addCurrentPlayer: true,
      options: [],
      inGame: sp.inGame,
    };

    this._playGame = this._playGame.bind(this);
  }

  _playGame(args) {
    navigate('Game', {
      currentGame: this.state.gkey
    });
  }

  render() {

    if( this.state.gametype ) {
      return (
        <Query
          query={GET_GAMESPEC_QUERY}
          variables={{
            gamespec: this.state.gametype
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

            const gamenav = this.state.inGame ? null : (
              <GameNav
                title='Game Setup'
                showBack={true}
              />
            );

            const courseSection = ( gs.location_type && gs.location_type == 'local' ) ? (
              <Courses
                gkey={this.state.gkey}
                navigation={this.props.navigation}
              />
            ) : null;

            const playerSection = (
              <Players
                gkey={this.state.gkey}
                gamespec={gs}
                addCurrentPlayer={this.state.addCurrentPlayer}
                navigation={this.props.navigation}
              />
            );

            const optionsSection = (
              <Card title="Options">
              </Card>
            );

            const playGameButton = this.state.inGame ? null : (
              <View style={styles.playButtonView}>
                <Button
                  title='Play Game'
                  backgroundColor={green}
                  color='white'
                  onPress={this._playGame}
                />
              </View>
            );

            return (
              <View style={styles.container}>
                {gamenav}
                <View style={styles.setupContainer}>
                  <View style={styles.gname}>
                    <Text style={styles.name_txt}>{gs.name}</Text>
                  </View>
                  <ScrollView>
                    { courseSection }
                    { playerSection }
                    { optionsSection }
                  </ScrollView>
                </View>
                {playGameButton}
              </View>
            );
          }}
        </Query>
      );
    } else {
      return (<ActivityIndicator />); // TODO: error, no gametype/spec?
    }
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
  playButtonView: {
    flex: 1,
    margin: 10
  },
  gname: {
    alignItems: 'center'
  },
  listContainer: {
    marginTop: 0,
    marginBottom: 10
  }
});
