import { gql, useQuery } from "@apollo/client";

export const query = gql`
  query login($email: String!, $fbToken: String!) {
    login(email: $email, fbToken: $fbToken) {
      player {
        _key
        email
        name
        short
        statusAuthz
        level
        token
        handicap {
          id
        }
      }
      message
    }
  }
`;

const useLoginQuery = (options: object) => {
  return useQuery(query, options);
};

export { useLoginQuery };
