import gql from 'graphql-tag';

export default gql`
  query GameSpecsForPlayer($pkey: String!) {
    gameSpecsForPlayer(pkey: $pkey) { _key name type }
  }
`;
