import gql from 'graphql-tag';

import { graphql } from 'react-apollo';


export function get(client, query, variables) {
  return client.query({
    query: gql`${query}`,
    variables: variables
  });
}
