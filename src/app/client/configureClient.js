import AsyncStorage from '@react-native-community/async-storage';
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  split,
} from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/link-context';
import { onError } from '@apollo/link-error';
import { WebSocketLink } from '@apollo/link-ws';

import { baseUri, scheme } from 'common/config';
import { logout } from 'common/utils/account';


export default function configureClient() {

  const cache = new InMemoryCache({
/*
    possibleTypes: {
      Game: ['Teams', 'Round', 'Player', 'GameSpec'],
      Teams: ['TeamHole'],
      TeamHole: ['Team'],
      Team: ['GameJunk'],
      Round: ['Score', 'Player', 'Tee'],
      Score: ['Value'],
      Player: ['Club', 'Handicap'],
      Tee: ['Rating', 'Course', 'Hole'],
      GameSpec: ['ScoringSpec', 'JunkSpec', 'MultiplierSpec', 'OptionSpec'],
      ScoringSpec: ['HoleScoringSpec'],
      OptionSpec: ['Choice'],
    },
*/
    //dataIdFromObject: object => object._key || null,

    typePolicies: {
      Game: {
        keyFields: object => object._key,
      },
      Teams: {
        keyFields: (object, context) => {
          console.log('object', object, 'context', context);
          return;
        },
        fields: {

        },
      },
      TeamHole: {
        fields: {
          hole: {
            keyArgs: ['hole'],
          }
        },
      },
      Round: {
        keyFields: object => object._key,
      },
      Player: {
        keyFields: object => object._key,
      },
      Club: {
        keyFields: object => object._key,
      },
      Tee: {
        keyFields: object => object._key,
      },
      Course: {
        keyFields: object => object._key,
      },
      GameSpec: {
        keyFields: object => object._key,
      },
    },
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
    uri: `${scheme}://${baseUri}/graphql`
  });

  const wsLink = new WebSocketLink({
    uri: `${scheme}://${baseUri}/subscription`,
    options: {
      reconnect: true
    }
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
    httpLink,
  );

  const defaultOptions = {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-only',
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
        splitLink
    ]),
    defaultOptions: defaultOptions
  });

  return {
    client: client,
  };

};
