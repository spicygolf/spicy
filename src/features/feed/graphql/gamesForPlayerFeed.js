import { gql } from '@apollo/client';

export const GAMES_FOR_PLAYER_FEED = gql`
  query GamesForPlayerFeed($begDate: String!, $currentPlayer: String!, $myClubs: [String]!) {
    gamesForPlayerFeed(begDate: $begDate, currentPlayer: $currentPlayer, myClubs: $myClubs) {
      game {
          _key
          name
          start
      }
      players {
          player {
              _key
              name
              short
              handicap {
                  index
                  revDate
              }
          }
          fave
          myclubs
          me
      }
    }
  }
`;