import React from 'react';

import { Query } from 'react-apollo';

import gql from 'graphql-tag';



export const GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY = gql`
  query GetFavoritePlayersForPlayer($pkey: String!) {
    getFavoritePlayersForPlayer(pkey: $pkey) {
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

export class GetFavoritePlayersForPlayer extends React.PureComponent {
  render() {
    const { children, pkey } = this.props;

    return (
      <Query
        query={GET_FAVORITE_PLAYERS_FOR_PLAYER_QUERY}
        variables={{
          pkey: pkey
        }}
        fetchPolicy='cache-and-network'
      >
        {({ data, loading, error }) => {
          if( error ) console.log('GetFavoritePlayersForPlayer error', error);
          return children({
            players: ( data && data.getFavoritePlayersForPlayer ) ?
              data.getFavoritePlayersForPlayer : [],
            loading
          });
        }}
      </Query>
    );
  }
}
