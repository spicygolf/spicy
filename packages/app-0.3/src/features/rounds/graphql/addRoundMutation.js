import { gql } from "@apollo/client";

export const ADD_ROUND_MUTATION = gql`
  mutation AddRound($round: RoundInput!) {
    addRound(round: $round) {
      _key
    }
  }
`;
