import React from 'react';
import { Provider } from 'react-redux';
import ApolloClient from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';
import { ApolloProvider } from 'react-apollo';

import { baseUrl } from 'common/config';
import configureStore from 'app/store/configureStore';
import { fetchInitialData } from 'app/store/initialData';
import TabsContainer from 'features/tabs/TabsContainer';


const store = configureStore();

const cache = new InMemoryCache({
  dataIdFromObject: object => object.key || null
});

const client = new ApolloClient({
  link: new HttpLink({
    uri: `${baseUrl}/graphql`
  }),
  cache
});

fetchInitialData(client, store);

export default class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <ApolloProvider client={client}>
          <TabsContainer />
        </ApolloProvider>
      </Provider>
    );
  }
};
