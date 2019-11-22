import React from 'react';

import { Mutation } from 'react-apollo';

import gql from 'graphql-tag';



export const ADD_GAME_MUTATION = gql`
  mutation AddGame($game: GameInput!) {
    addGame(game: $game) {
      _key
      start
    }
  }
`;

export class AddGameMutation extends React.PureComponent {

  render() {
    const { children, game } = this.props;
    return (
      <Mutation
        mutation={ADD_GAME_MUTATION}
        variables={{game: game}}
      >
        {mutate => {
          return children({
            addGameMutation: mutate
          });
        }}
      </Mutation>
    );
  }

};
