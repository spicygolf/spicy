import React, { Component } from 'react';
import {
  ApolloProvider,
} from 'react-apollo';

import configureClient from 'app/client/configureClient';
import AppContainer from 'app/components/appcontainer';


class App extends Component {
  render() {
    const { client, persistor } = configureClient();
    return (
      <ApolloProvider client={client}>
        <AppContainer
          uriPrefix='/spicygolf'
        />
      </ApolloProvider>
    );
  }
};

export default App;

// temporary for RN #3965
import { YellowBox } from 'react-native';
YellowBox.ignoreWarnings([
  'Warning: isMounted(...) is deprecated',
  'Module RCTImageLoader'
]);
