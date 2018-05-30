import React from 'react';
import { Provider } from 'react-redux';
import { ApolloProvider } from 'react-apollo';

import configureStore from 'app/store/configureStore';
import configureClient from 'app/client/configureClient';
import { fetchInitialData } from 'app/store/initialData';
import TabsContainer from 'features/tabs/TabsContainer';


const store = configureStore();

const client = configureClient();

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

// temporary for RN #3965
import { YellowBox } from 'react-native';
YellowBox.ignoreWarnings(['Warning: isMounted(...) is deprecated', 'Module RCTImageLoader']);
