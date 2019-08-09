'use strict';

import React from 'react';

import {
  ActivityIndicator,
  Text,
  View
} from 'react-native';

import { Query, withApollo } from 'react-apollo';
import { CURRENT_GAME_QUERY, GET_GAME_QUERY } from 'features/games/graphql';

import GameNav from 'features/games/gamenav';
import Leaderboard from 'features/games/leaderboard';


class Game extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      currentGame: null
    };
  }

  componentDidMount() {
    // get currentGame from cache
    const rq = this.props.client.readQuery({
      query: CURRENT_GAME_QUERY
    });
    this.setState(prev => ({
      currentGame: rq.currentGame
    }));
  }

  render() {
    if( this.state.currentGame ) {
      return (
        <Query
          query={GET_GAME_QUERY}
          variables={{game: this.state.currentGame._key}}
        >
          {({ loading, error, data }) => {
            if( loading ) return (<ActivityIndicator />);
            if( error ) {
              console.log(error);
              return (<Text>Error</Text>);
            }
            console.log('game data', data);
            return (
              <View>
                <GameNav
                  title={this.state.currentGame.name}
                  showBack={true}
                  showScore={false}
                  navigation={this.props.navigation}
                />
                <Leaderboard
                  currentGame={this.state.currentGame}
                />
              </View>
            );
          }}
        </Query>
      );
    } else {
      return (<ActivityIndicator />);
    }
  }

}

export default withApollo(Game);
