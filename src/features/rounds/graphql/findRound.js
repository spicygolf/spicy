import React from 'react';

import { Query } from 'react-apollo';

import gql from 'graphql-tag';



export const FIND_ROUND_QUERY = gql`
  query FindRound($gkey: String!, $pkey: String!) {
    findRound( gkey: $gkey, pkey: $pkey) {
      _key
      date
      seq
    }
  }
`;

export class FindRound extends React.PureComponent {
  render() {
    const { children, gkey, pkey } = this.props;

    return (
      <Query
        query={FIND_ROUND_QUERY}
        variables={{
          gkey: gkey,
          pkey: pkey,
        }}
        fetchPolicy='cache-and-network'
      >
        {({ data, loading, error }) => {
          if( error ) console.log('findRound error', error);
          return children({
            findRound: (data && data.findRound) ? data.findRound : {},
            loading
          });
        }}
      </Query>
    );
  }
}
