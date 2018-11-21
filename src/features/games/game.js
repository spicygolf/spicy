'use strict';

import React from 'react';

import {
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
          fetchPolicy='cache-and-network'
        >
          {({ loading, error, data }) => {
            if( loading ) return (<Text>Loading...</Text>);
            if( error ) {
              console.log(error);
              return (<Text>Error</Text>);
            }
            return (
              <View>
                <GameNav
                  title={this.state.currentGame.name}
                  showBack={true}
                  showScore={false}
                />
                <Leaderboard
                  currentGame={this.state.currentGame}
                />
              </View>
            )
          }}
        </Query>
      );
    } else {
      return (<Text>Loading...</Text>);
    }
  }

}

export default withApollo(Game);
