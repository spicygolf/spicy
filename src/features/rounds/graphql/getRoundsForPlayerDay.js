import React from 'react';

import { Query } from 'react-apollo';

import gql from 'graphql-tag';



export const GET_ROUNDS_FOR_PLAYER_DAY_QUERY = gql`
  query GetRoundsForPlayerDay($pkey: String!, $day: String!) {
    getRoundsForPlayerDay(pkey: $pkey, day: $day) {
      date
      seq
      scores {
        hole
        values {
          k
          v
          ts
        }
      }
    }
  }
`;

export class GetRoundsForPlayerDay extends React.PureComponent {
  render() {
    const { children, pkey, day } = this.props;
    return (
      <Query
        query={GET_ROUNDS_FOR_PLAYER_DAY_QUERY}
        variables={{
          pkey: pkey,
          day: day
        }}
        fetchPolicy='cache-and-network'
      >
        {({ data, loading, error }) => {
          if( error ) console.log('getRoundsForPlayerDay error', error);
          return children({
            rounds: (data && data.GetRoundsForPlayerDay ) ? data.GetRoundsForPlayerDay : [],
            loading
          });
        }}
      </Query>
    );
  }
}
