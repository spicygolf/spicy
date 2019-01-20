import React from 'react';

import { Mutation } from 'react-apollo';

import gql from 'graphql-tag';



export const ADD_PLAYER_MUTATION = gql`
  mutation AddPlayer($player: PlayerInput!) {
    addPlayer(player: $player) {
      _key
    }
  }
`;

export class AddPlayerMutation extends React.PureComponent {

  render() {
    const { children, player } = this.props;
    return (
      <Mutation
        mutation={ADD_PLAYER_MUTATION}
        variables={{player: player}}
      >
        {(mutate, {loading, error, data}) => {
          return children(mutate, {loading, error, data});
        }}
      </Mutation>
    );
  }

};
