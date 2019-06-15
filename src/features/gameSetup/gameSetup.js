'use strict';

import React from 'react';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import AsyncStorage from '@react-native-community/async-storage';

import {
  Button,
  Card,
  ListItem
} from 'react-native-elements';

import { Query } from 'react-apollo';
import { GET_TEE_FOR_GAME_QUERY } from 'features/courses/graphql';
import { GET_PLAYERS_FOR_GAME_QUERY } from 'features/players/graphql';
import { AddLinkMutation } from 'common/graphql/link';
import { GET_GAMESPEC_QUERY } from 'features/games/graphql';
import { navigate } from 'common/components/navigationService';

import Courses from 'features/gameSetup/courses';
import Players from 'features/gameSetup/players';
import GameNav from 'features/games/gamenav';
import FavoriteIcon from 'common/components/favoriteIcon';

import { green } from 'common/colors';



class GameSetup extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      gametype: this.props.gametype,
      addCurrentPlayer: true,
      options: []
    };

    this.getGameKey = this.getGameKey.bind(this);
    this.getCurrentPlayerKey = this.getCurrentPlayerKey.bind(this);
    this._renderTee = this._renderTee.bind(this);
    this.renderPlayer = this.renderPlayer.bind(this);
    //this.addPlayer = this.addPlayer.bind(this);
    //this.removePlayer = this.removePlayer.bind(this);
  }

  getCurrentPlayerKey() {
    return this.state.currentPlayerKey;
  }

  getGameKey() {
    return this.props.gkey;
  }

  renderCourseTee({item}) {
    return this._renderTee(
      item,
      item.name,
      `${item.gender} - ${item.rating}/${item.slope}`
    );
  }

  renderFavoritesTee({item}) {
    return this._renderTee(
      item,
      item.course.name,
      `${item.name} - ${item.rating.all18}/${item.slope.all18}`
    );
  }

  _renderTee(item, title, subtitle) {
    const { gkey } = this.props;
    return (
      <AddLinkMutation>
        {({addLinkMutation}) => (
          <ListItem
            title={title}
            subtitle={subtitle}
            onPress={async () => {
              const {data, errors} = await addLinkMutation({
                variables: {
                  from: {type: 'game', value: gkey},
                  to: {type: 'tee', value: item._key}
                },
                refetchQueries: [{
                  query: GET_TEE_FOR_GAME_QUERY,
                  variables: {
                    gkey: gkey
                  }
                }]
              });
              if( errors ) {
                console.log('error adding tee to game', errors);
              }
              navigate('GameSetup');
            }}
            leftIcon={(
              <FavoriteIcon
                fave={item.fave}
              />
            )}
          />
        )}
      </AddLinkMutation>
    );
  }

/*
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
*/

  renderPlayer({item}) {
    const { gkey } = this.props;

    const handicap = (item && item.handicap && item.handicap.display) ?
      item.handicap.display : 'no handicap';
    const club = (item && item.clubs && item.clubs[0]) ?
      ` - ${item.clubs[0].name}` : '';

    return (
      <AddLinkMutation>
        {({addLinkMutation}) => (
          <ListItem
            title={item.name}
            subtitle={`${handicap}${club}`}
            onPress={async () => {
              const {data, errors} = await addLinkMutation({
                variables: {
                  from: {type: 'player', value: item._key},
                  to: {type: 'game', value: gkey}
                },
                refetchQueries: [{
                  query: GET_PLAYERS_FOR_GAME_QUERY,
                  variables: {
                    gkey: gkey
                  }
                }]
              });
              if( errors ) {
                console.log('error adding player to game', errors);
              }
              navigate('GameSetup');
            }}
            leftIcon={(
              <FavoriteIcon
                fave={item.fave}
              />
            )}
          />
        )}
      </AddLinkMutation>
    );
  }

  async componentDidMount() {
    const cpkey = await AsyncStorage.getItem('currentPlayer');
    this.setState({
      currentPlayerKey: cpkey
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
            const courseSection = ( gs.location_type && gs.location_type == 'local' ) ?
            (
              <Courses
                gkey={this.props.gkey}
              />
            ) : null;

            const playerSection = (
              <Players
                gkey={this.props.gkey}
                gamespec={gs}
                addCurrentPlayer={this.state.addCurrentPlayer}
              />
            );

            const optionsSection = (
              <Card title="Options">
              </Card>
            );

            return (
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
          }}
        </Query>
      );
    } else {
      return (<ActivityIndicator />); // TODO: error, no gametype/spec?
    }
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
