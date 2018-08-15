import gql from 'graphql-tag';

export default gql`
    fragment my_round on Round {
      _key
      scores
    }
`;
