import { gql, useSubscription } from "@apollo/client";

const query = gql`
  subscription onScorePosted($rkey: String!) {
    scorePosted(rkey: $rkey) {
      _key
      scores {
        hole
        values {
          k
          v
          ts
        }
      }
    }
  }
`;

export const useScorePostedSubscription = (options: object) => {
  return useSubscription(query, options);
};
