import { AsyncStorage } from 'react-native';
import { ApolloLink } from 'apollo-link';
import ApolloClient from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { persistCache } from 'apollo-cache-persist';
import { withClientState } from 'apollo-link-state';
import { HttpLink } from 'apollo-link-http';

import { baseUrl } from 'common/config';
import { resolvers } from './resolvers';


export default function configureClient() {

  const cache = new InMemoryCache({
    dataIdFromObject: object => object.key || null
  });

  const defaults = {
    watchQuery: {
      __typename: 'watchQuery',
      errorPolicy: 'ignore'
    },
    query: {
      __typename: 'query',
      errorPolicy: 'all'
    },
    mutate: {
      __typename: 'mutate',
      errorPolicy: 'all'
    },
  };

  const stateLink = withClientState({
    cache, resolvers, defaults,
  });

  // NOTE: This must go after the call to withClientState. Otherwise that will
  //       overwrite the cache with defaults.
  persistCache({
    cache,
    storage: AsyncStorage,
    maxSize: false, // set to unlimited (default is 1MB
    // https://github.com/apollographql/apollo-cache-persist)
    debug: true // enables console logging
  });

  const httpLink = new HttpLink({
    uri: `${baseUrl}/graphql`
  });

  const client = new ApolloClient({
    cache,
    link: ApolloLink.from([
        stateLink,
        httpLink
    ])
  });

  return client;

};
