import gql from 'graphql-tag';

export default gql`
  query SearchGhinPlayer($q: String!) {
    searchGhinPlayer(q: $q) {
      _key
      playerName
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
