import { gql } from '@apollo/client';

export const STAT_FOR_PLAYER_FEED = gql`
query StatForPlayerFeed(
  $begDate: String!,
  $endDate: String!,
  $stat: String!,
  $currentPlayer: String!,
  $myClubs: [String]!
) {
  statForPlayerFeed(
      begDate: $begDate,
      endDate: $endDate,
      stat: $stat,
      currentPlayer: $currentPlayer,
      myClubs: $myClubs
  )
}
`;
