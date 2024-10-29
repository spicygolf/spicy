import { gql } from '@apollo/client';

export const DELETE_ROUND_MUTATION = gql`
  mutation DeleteRound($rkey: String!) {
    deleteRound(rkey: $rkey) {
      _key
    }
  }
`;
