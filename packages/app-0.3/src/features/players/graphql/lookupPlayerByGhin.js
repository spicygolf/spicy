import { gql } from "@apollo/client";

export const LOOKUP_PLAYER_BY_GHIN = gql`
  query LookupPlayerByGhin($ghin: String!) {
    lookupPlayerByGhin(ghin: $ghin) {
      _key
    }
  }
`;
