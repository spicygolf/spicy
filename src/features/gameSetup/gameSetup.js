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

import { GET_TEE_FOR_GAME_QUERY } from 'features/courses/graphql';
import { AddLinkMutation } from 'common/graphql/link';
import { navigate } from 'common/components/navigationService';

import Courses from 'features/gameSetup/courses';
import Players from 'features/gameSetup/players';
import GameNav from 'features/games/gamenav';

import { green } from 'common/colors';



class GameSetup extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      players: this.props.players || [],
      currentPlayerKey: null,
      addCurrentPlayer: true,
      options: []
    };
    this.renderTee = this.renderTee.bind(this);

    this.addPlayer = this.addPlayer.bind(this);
    this.removePlayer = this.removePlayer.bind(this);
  }

  getGameKey() {
    return this.props.gkey;
  }

  renderTee({item}) {
    const { gkey } = this.props;
    return (
      <AddLinkMutation>
        {({addLinkMutation}) => (
          <ListItem
            title={item.name || ''}
            subtitle={`${item.gender} - rating: ${item.rating}, slope: ${item.slope}`}
            onPress={async () => {
              const {data, errors} = await addLinkMutation({
                variables: {
                  from: {type: 'game', value: gkey},
                  to: {type: 'tee', value: item._key}
                },
                refetchQueries: [
                  {
                    query: GET_TEE_FOR_GAME_QUERY,
                    variables: {
                      gkey: gkey
                    }
                  }
                ]
              });
              if( errors ) {
                console.log('error adding tee to game', errors);
                return (<Text>Error</Text>);
              }
              navigate('GameSetup');
            }}
          />
        )}
      </AddLinkMutation>
    );
  }

  addPlayer(pkey) {
    this.setState(prev => {
      if( !prev.players.includes(pkey) ) {
        prev.players.push(pkey);
      }
      return {
        players: prev.players
      };
    });
  }

  removePlayer(pkey) {
    this.setState(prev => ({
      players: filter(prev.players, (p) => (p !== pkey)),
      addCurrentPlayer: !(pkey == this.state.currentPlayerKey)
    }));
  }

  async componentDidMount() {
    // TODO: check this.props.players (cuz gameSetup could be entered for an
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

    if( this.props.gamespec ) {

      const gs = this.props.gamespec;

      const courseSection = ( gs.location_type && gs.location_type == 'local' ) ?
       (
        <Courses
          gkey={this.props.gkey}
          showButton={true}
        />
      ) : null;

      const playerSection = (
        <Players
         players={this.state.players}
         showButton={ this.state.players.length < gs.max_players ||
                      gs.max_players < 0 }
         addCurrentPlayer={this.state.addCurrentPlayer}
        />
      );

      const optionsSection = (
        <Card title="Options">
        </Card>
      );

      content = (
        <View style={styles.container}>
          <GameNav
            title='Game Setup'
            showBack={true}
          />
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
          <View style={styles.playButtonView}>
            <Button
              title='Play Game'
              backgroundColor={green}
              color='white'
            />
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
