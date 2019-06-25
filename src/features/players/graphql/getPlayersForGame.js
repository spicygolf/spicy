import React from 'react';

import { Query } from 'react-apollo';

import gql from 'graphql-tag';



export const GET_PLAYERS_FOR_GAME_QUERY = gql`
  query GetPlayersForGame($gkey: String!) {
    getPlayersForGame(gkey: $gkey) {
      _key
      name
      short
      handicap {
        value
        revDate
        display
        tournamentScoreCount
      }
      clubs {
        _key
        name
        state
      }
    }
  }
`;

export class GetPlayersForGame extends React.PureComponent {
  render() {
    const { children, gkey } = this.props;
    return (
      <Query
        query={GET_PLAYERS_FOR_GAME_QUERY}
        variables={{
          gkey: gkey
        }}
        fetchPolicy='cache-and-network'
      >
        {({ data, loading, error }) => {
          if( error ) console.log('getPlayersForGame error', error);
          return children({
            players: (data && data.getPlayersForGame ) ? data.getPlayersForGame : [],
            loading
          });
        }}
      </Query>
    );
  }
}
