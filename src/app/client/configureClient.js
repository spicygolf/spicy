import ApolloClient from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';

import { baseUrl } from 'common/config';


export default function configureClient() {

  const cache = new InMemoryCache({
    dataIdFromObject: object => object.key || null
  });

  const defaultOptions = {
    watchQuery: {
      errorPolicy: 'ignore'
    },
    query: {
      errorPolicy: 'all'
    },
    mutate: {
      errorPolicy: 'all'
    }
  };

  const client = new ApolloClient({
    link: new HttpLink({
      uri: `${baseUrl}/graphql`
    }),
    cache,
    defaultOptions: defaultOptions
  });

  return client;

};
