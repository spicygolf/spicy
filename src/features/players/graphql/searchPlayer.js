import gql from 'graphql-tag';

export default gql`
  query SearchPlayer($q: String!) {
    searchPlayer(q: $q) {
      _key
      name
      handicap {
        revDate
        display
      }
      clubs {
        _key
        name
        state
      }
    }
  }
`;
