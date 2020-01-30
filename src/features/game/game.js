'use strict';

import React from 'react';

import {
  ActivityIndicator,
  Text
} from 'react-native';

import { Query, withApollo } from 'react-apollo';
import { GET_GAME_QUERY } from 'features/games/graphql';

import GameStack from 'features/game/gamestack';


class Game extends React.Component {

  // https://reactnavigation.org/docs/en/common-mistakes.html#explicitly-rendering-more-than-one-navigator
  static router = GameStack.router;

  constructor(props) {
    super(props);
  }

  render() {

    const setup = this.props.navigation.getParam('setup');
    const currentGameKey = this.props.navigation.getParam('currentGame');

    return (
      <Query
        query={GET_GAME_QUERY}
        variables={{
          gkey: currentGameKey
        }}
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
                game: data.getGame,
                setup: setup
              }}
            />
          );
        }}
      </Query>
    );
  }

}

export default withApollo(Game);
