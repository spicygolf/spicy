import React from 'react';

import { Query } from 'react-apollo';

import gql from 'graphql-tag';



export const GET_FAVORITE_TEES_FOR_PLAYER_QUERY = gql`
  query GetFavoriteTeesForPlayer($pkey: String!) {
    getFavoriteTeesForPlayer(pkey: $pkey) {
      _key
      name
      gender
      rating {
        all18
        front9
        back9
      }
      slope {
        all18
        front9
        back9
      }
      course {
        _key
        name
        city
        state
      }
    }
  }
`;

export class GetFavoriteTeesForPlayer extends React.PureComponent {
  render() {
    const { children, pkey } = this.props;
    return (
      <Query
        query={GET_FAVORITE_TEES_FOR_PLAYER_QUERY}
        variables={{
          pkey: pkey
        }}
        fetchPolicy='cache-and-network'
      >
        {({ data, loading, error }) => {
          if( error ) console.log('getFavoriteTeesForPlayer error', error);
          return children({
            tees: ( data && data.getFavoriteTeesForPlayer ) ?
              data.getFavoriteTeesForPlayer : [],
            loading
          });
        }}
      </Query>
    );
  }
}
