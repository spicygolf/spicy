import { gql } from '@apollo/client';

export const MERGE_PLAYERS_MUTATION = gql`
  mutation MergePlayers($source: PlayerKeyInput!, $target: HandicapInput!) {
    mergePlayers(source: $source, target: $target) {
      _key
      name
      statusAuthz
      level
      short
      handicap {
        source
        id
        index
        revDate
        gender
        clubs {
          _key
          name
          state
        }
      }
    }
  }
`;
