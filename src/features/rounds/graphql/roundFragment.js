import { gql } from '@apollo/client';

export default gql`
    fragment my_round on Round {
      _key
      scores
    }
`;
