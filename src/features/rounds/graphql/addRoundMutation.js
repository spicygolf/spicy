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
