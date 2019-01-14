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
          console.log('update args', args);
        }}
      >
        {(mutate, {loading, error, data}) => {
/*
          console.log('props', this.props);
          console.log('renderProp mutate', mutate);
          console.log('renderProp loading', loading);
          console.log('renderProp error', error);
          console.log('renderProp data', data);
*/
          //mutate({player: player});
          return children(mutate, {loading, error, data});
        }}
      </Mutation>
    );
  }

};
