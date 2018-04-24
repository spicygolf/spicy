'use strict';

import React from 'react';

import {
  Text,
  View
} from 'react-native';

import { connect } from 'react-redux';
import gql from "graphql-tag";
import { Query } from "react-apollo";

import GameNav from 'features/games/gamenav';
import Leaderboard from 'features/games/leaderboard';

import { selectRoundsPlayers } from 'features/rounds/roundSelectors';


const GAME_QUERY = gql`
  query GetGame($game: String!) {
    getGame(_key: $game) {
      rounds {
        _key date seq scores {
          hole values {
            k v ts
          }
        }
      }
    }
  }
`;


class Game extends React.Component {

  render() {

    const vars = {game: this.props.currentGame._key};

    return (
      <Query query={GAME_QUERY} variables={vars}>
        {({ loading, error, data}) => {
          if( loading ) return (<Text>Loading...</Text>);
          if( error ) {
            console.error(error);
            return (<Text>Error!</Text>);
          }

          console.log('data', data);
          console.log('game type', this.props.currentGame.gametype);

          return (
            <View>
              <GameNav
                title={this.props.currentGame.name}
                showBack={true}
                showScore={false}
              />
            </View>
          );
        }}
      </Query>
    );
  }

}

function mapState(state) {
  return {
    roundsPlayers: selectRoundsPlayers(state),
    currentGame: state.games.currentGame
  };
}

const actions = {};

export default connect(mapState, actions)(Game);
