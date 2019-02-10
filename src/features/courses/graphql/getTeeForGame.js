import React from 'react';

import { Query } from 'react-apollo';

import gql from 'graphql-tag';



export const GET_TEE_FOR_GAME_QUERY = gql`
  query GetTeeForGame($gkey: String!) {
    getTeeForGame(gkey: $gkey) {
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

export class GetTeeForGame extends React.PureComponent {
  render() {
    const { children, gkey } = this.props;
    return (
      <Query
        query={GET_TEE_FOR_GAME_QUERY}
        variables={{
          gkey: gkey
        }}
        fetchPolicy='cache-and-network'
      >
        {({ data, loading, error }) => {
          if( error ) console.log('getTeeForGame error', error);
          //console.log('getTeeForGame data', data, loading, gkey);
          return children({
            tee: (data && data.getTeeForGame ) ? data.getTeeForGame : {},
            loading
          });
        }}
      </Query>
    );
  }
}
