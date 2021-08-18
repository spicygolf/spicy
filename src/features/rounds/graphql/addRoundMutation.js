import { gql } from '@apollo/client';
import React from 'react';
import { Mutation } from 'react-apollo';

export const ADD_ROUND_MUTATION = gql`
  mutation AddRound($round: RoundInput!) {
    addRound(round: $round) {
      _key
    }
  }
`;
