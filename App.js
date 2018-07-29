import React, { Component } from 'react';
import {
  ApolloProvider,
} from 'react-apollo';

import configureClient from 'app/client/configureClient';
import Auth from 'common/components/Auth';


class App extends Component {
  render() {
    const client = configureClient();
    return (
      <ApolloProvider client={client}>
        <Auth />
      </ApolloProvider>
    );
  }
};

export default App;

// temporary for RN #3965
import { YellowBox } from 'react-native';
YellowBox.ignoreWarnings(['Warning: isMounted(...) is deprecated', 'Module RCTImageLoader']);
