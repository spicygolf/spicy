import React from 'react';

import { Mutation } from 'react-apollo';

import gql from 'graphql-tag';



export const ADD_ROUND_MUTATION = gql`
  mutation AddRound($round: RoundInput!) {
    addRound(round: $round) {
      _key
    }
  }
`;

export class AddRoundMutation extends React.PureComponent {

  render() {
    const { children, round } = this.props;
    return (
      <Mutation
        mutation={ADD_ROUND_MUTATION}
        variables={{round: round}}
      >
        {mutate => {
          return children({
            addRoundMutation: mutate
          });
        }}
      </Mutation>
    );
  }

};
