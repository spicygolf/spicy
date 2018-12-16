import { AsyncStorage } from 'react-native';
import { ApolloLink } from 'apollo-link';
import ApolloClient from 'apollo-client';
import { Hermes } from 'apollo-cache-hermes';
import { persistCache } from 'apollo-cache-persist';
import { setContext } from 'apollo-link-context';
import { onError } from 'apollo-link-error';
import { HttpLink } from 'apollo-link-http';

import { baseUrl } from 'common/config';
import { logout } from 'common/utils/auth';


export default function configureClient() {

  const cache = new Hermes({
    entityIdForNode: object => object._key || undefined
  });

  // NOTE: This must go after the call to withClientState. Otherwise that will
  //       overwrite the cache with defaults.
  persistCache({
    cache,
    storage: AsyncStorage,
    maxSize: false, // set to unlimited (default is 1MB
    // https://github.com/apollographql/apollo-cache-persist)
    debug: true // enables console logging // TODO: remove me
  });

  const authLink = setContext((_, { headers }) => {
    // get the authentication token from local storage if it exists
    return AsyncStorage.getItem('token')
      // return the headers to the context so httpLink can read them
      .then(token => {
        //console.log('token', token);
        return ({
          headers: {
            ...headers,
            authorization: `Bearer ${token}`,
          }
        });
      })
      .catch(err => {
        return headers
      });
  });

  const errorLink = onError(({
      graphQLErrors,
      networkError,
      operation,
      forward
    }) => {
    if (graphQLErrors)
      graphQLErrors.map(({ message, locations, path }) =>
        console.log(
          `[GraphQL error]:
            Message: ${message},
            Location: ${locations},
            Path: ${path}`,
        ),
      );

    if (networkError) {
      if( networkError.statusCode == 401 ) {
        console.log('logged out');
        logout(cache.client);
      }
      console.log(`[Network error]: ${networkError}`);
    }
  });

  const httpLink = new HttpLink({
    uri: `${baseUrl}/graphql`
  });

  const defaultOptions = {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all'
    }
  };

  const client = new ApolloClient({
    cache,
    link: ApolloLink.from([
        errorLink,
        authLink,
        httpLink
    ]),
    defaultOptions: defaultOptions
  });

  return client;

};
