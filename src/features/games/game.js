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

import { storeRound } from 'features/games/gameActions';
import { selectRoundsPlayers } from 'features/rounds/roundSelectors';


const GAME_QUERY = gql`
  query GetGame($game: String!) {
    getGame(_key: $game) {
      rounds {
        _key
        date
        seq
        scores {
          hole
          values {
            k v ts
          }
        }
        player {
          _key
          name
          short
        }
      }
    }
  }
`;


class Game extends React.Component {

  componentWillMount() {
    const vars = {game: this.props.currentGame._key};

    let q = (
      <Query query={GAME_QUERY} variables={vars}>
        {
          ({ loading, error, data}) => {
            if( loading ) return null;
            if( error ) {
              console.error(error);
              return null;
            }

            // save rounds to state
            data.getGame.rounds.map(round => {
              this.props.storeRound(round);
            });
            return null;
          }
        }
      </Query>
    );
    console.log('q', q);
  }

  render() {

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

  }

}

function mapState(state) {
  return {
    roundsPlayers: selectRoundsPlayers(state),
    currentGame: state.games.currentGame
  };
}

const actions = {
  storeRound
};

export default connect(mapState, actions)(Game);
