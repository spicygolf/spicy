import gql from 'graphql-tag';

export default gql`
  query GetPlayer($player: String!) {
    getPlayer(_key: $player) {
      _key
      name
      short
      handicap {
        value
        revDate
        display
        tournamentScoreCount
      }
    }
  }
`;
