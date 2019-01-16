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
        update={(store, args) => {
          console.log('addPlayerMutation update store, args', store, args);
        }}
      >
        {mutate => {
          return children({
            addPlayerMutation: mutate
          });
        }}
      </Mutation>
    );
  }

};
