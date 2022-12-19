import { gql } from '@apollo/client';

export const GET_PLAYER_BY_EMAIL_QUERY = gql`
  query GetPlayerByEmail($email: String!, $needToken: Boolean!) {
    getPlayerByEmail(email: $email, needToken: $needToken) {
      _key
      name
      email
      statusAuthz
      level
      short
      handicap {
        source
        id
        index
        revDate
        clubs {
          name
          state
        }
      }
      token
    }
  }
`;
