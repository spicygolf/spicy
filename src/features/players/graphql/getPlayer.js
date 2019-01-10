import React from 'react';

import { Query } from 'react-apollo';

import gql from 'graphql-tag';



export const GET_PLAYER_QUERY = gql`
  query GetPlayer($player: String!) {
    getPlayer(_key: $player) {
      _key
      name
      short
      handicap {
        value
        revDate
        display
        tournamentScoreCount
      }
    }
  }
`;

export class GetPlayer extends React.PureComponent {
  render() {
    const { children, pkey } = this.props;
    return (
      <Query
        query={GET_PLAYER_QUERY}
        variables={{player: pkey}}
      >
        {({ data, loading }) => {
          let player = {};
          if (data && data.getPlayer) {
            player = data.getPlayer;
          }
          return children({
            player,
            loading
          });
        }}
      </Query>
    );
  }
}
