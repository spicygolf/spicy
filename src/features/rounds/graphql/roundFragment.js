import { gql } from '@apollo/client';

export const ROUND_FRAGMENT = gql`
    fragment my_round on Round {
      _key
      scores
    }
`;
