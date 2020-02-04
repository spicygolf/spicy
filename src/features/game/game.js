import React, { createContext } from 'react';

import {
  ActivityIndicator,
  Text
} from 'react-native';

import { Query, withApollo } from 'react-apollo';
import { GET_GAME_QUERY } from 'features/games/graphql';
import { GameContext } from 'features/game/gamecontext';
import GameStack from 'features/game/gamestack';


class Game extends React.Component {

  // https://reactnavigation.org/docs/en/common-mistakes.html#explicitly-rendering-more-than-one-navigator
  static router = GameStack.router;

  constructor(props) {
    super(props);
  }

  render() {

    const currentGameKey = this.props.navigation.getParam('currentGameKey');
    const currentPlayerKey = this.props.navigation.getParam('currentPlayerKey');

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
          console.log('game data', data.getGame);
          return (
            <GameContext.Provider value={{
              game: data.getGame,
              gamespec: { team_size: 2, max_players: 4 }, // TODO: fetch this from game setup / db
              currentPlayerKey: currentPlayerKey,
            }}>
              <GameStack
                navigation={this.props.navigation}
             />
            </GameContext.Provider>
          );
        }}
      </Query>
    );
  }

}

export default withApollo(Game);
