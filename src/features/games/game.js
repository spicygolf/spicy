'use strict';

import React from 'react';

import {
  Text,
  View
} from 'react-native';

import { connect } from 'react-redux';
import gql from "graphql-tag";
import { withApollo } from "react-apollo";

import GameNav from 'features/games/gamenav';
import Leaderboard from 'features/games/leaderboard';

import {
  storeRound,
  storeRoundIDsInGame
} from 'features/games/gameActions';
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

  async componentWillMount() {
    const gkey = this.props.currentGame._key;

    // query for rounds/players in this game
    const { data } = await this.props.client.query({
      query: GAME_QUERY,
      variables: {game: gkey}
    });

    // save rounds to state
    let round_ids = [];
    data.getGame.rounds.map(round => {
      round_ids.push(round._key);
      this.props.storeRound(round);
    });

    // add round ids to game
    this.props.storeRoundIDsInGame(gkey, round_ids);
  }

  render() {

    return (
      <View>
        <GameNav
          title={this.props.currentGame.name}
          showBack={true}
          showScore={false}
        />
        <Leaderboard {...this.props} />
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
  storeRound,
  storeRoundIDsInGame
};

export default withApollo(connect(mapState, actions)(Game));
