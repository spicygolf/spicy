import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/link-context';
import { onError } from '@apollo/link-error';
import { WebSocketLink } from '@apollo/link-ws';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OfflineLink from 'apollo-link-offline';
// import { persistCache } from 'apollo3-cache-persist';
import possibleTypes from 'app/client/possibleTypes';
import typePolicies from 'app/client/typePolicies';
import { baseUri, scheme } from 'common/config';

const configureClient = async () => {
  const cache = new InMemoryCache({
    dataIdFromObject: object => {
      //console.log('object', object);
      return object._key || null;
    },
    typePolicies: typePolicies,
    possibleTypes: possibleTypes,
  });

  const authLink = setContext((_, { headers }) => {
    // get the authentication token from local storage if it exists
    return (
      AsyncStorage.getItem('token')
        // return the headers to the context so httpLink can read them
        .then(token => {
          //console.log('token', token);
          return {
            headers: {
              ...headers,
              authorization: `Bearer ${token}`,
            },
          };
        })
        .catch(_err => {
          return headers;
        })
    );
  });

  const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
    if (graphQLErrors) {
      graphQLErrors.map(({ message, locations, path }) =>
        console.log(
          `[GraphQL error]:
            Message: ${message},
            Location: ${locations},
            Path: ${path}`,
        ),
      );
    }

    if (networkError) {
      // ignore these, because we're building this thing 'offline-first'
      console.log(`[Network error]: ${networkError}`);
    }
  });

  const httpLink = new HttpLink({
    uri: `${scheme}://${baseUri}/graphql`,
  });

  const wsLink = new WebSocketLink({
    uri: `${scheme}://${baseUri}/subscription`,
    options: {
      reconnect: true,
    },
  });

  const offlineLink = new OfflineLink({
    storage: AsyncStorage,
    sequential: true,
  });

  // The split function takes three parameters:
  //
  // * A function that's called for each operation to execute
  // * The Link to use for an operation if the function returns a "truthy" value
  // * The Link to use for an operation if the function returns a "falsy" value
  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wsLink,
    ApolloLink.from([offlineLink, httpLink]),
  );

  const defaultOptions = {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  };

  const client = new ApolloClient({
    cache,
    link: ApolloLink.from([errorLink, authLink, splitLink]),
    defaultOptions: defaultOptions,
  });

  // await persistCache({
  //   cache,
  //   storage: AsyncStorage,
  //   maxSize: false,
  //   debug: false,
  // });

  offlineLink.setup(client);

  return client;
};

export default configureClient;
