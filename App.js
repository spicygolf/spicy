import React from 'react';
import { Provider } from 'react-redux';
import { ApolloClient } from 'apollo-client';
import { ApolloProvider } from 'react-apollo';

import { baseUrl } from 'common/config';
import configureStore from 'app/store/configureStore';
import { fetchInitialData } from 'app/store/initialData';
import TabsContainer from 'features/tabs/TabsContainer';


const store = configureStore();
const client = new ApolloClient({
  uri: `${baseUrl}/graphql`
});

fetchInitialData(store);

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
