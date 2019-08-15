'use strict';

import React from 'react';

import {
  ActivityIndicator,
  Text
} from 'react-native';

import { Query, withApollo } from 'react-apollo';
import { CURRENT_GAME_QUERY, GET_GAME_QUERY } from 'features/games/graphql';

import GameStack from 'features/game/gamestack';


class Game extends React.Component {

  // https://reactnavigation.org/docs/en/common-mistakes.html#explicitly-rendering-more-than-one-navigator
  static router = GameStack.router;

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
            //console.log('game data', data);
            return (
              <GameStack
                navigation={this.props.navigation}
                screenProps={{
                  currentGame: this.state.currentGame,
                  game: data.getGame
                }}
              />
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
