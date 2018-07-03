import React, { Component } from 'react';
//import { Provider } from 'react-redux';
import {
  ApolloProvider,
} from 'react-apollo';

//import configureStore from 'app/store/configureStore';
import configureClient from 'app/client/configureClient';
import InitialData from 'common/components/initialData';
import TabsContainer from 'features/tabs/TabsContainer';


//const store = configureStore();
const client = configureClient();

// TODO: get this user _key from local storage
const currentPlayer = '11155149';    // local dev
//const currentPlayer = '16257780'; // server


class App extends Component {
  render() {
    return (
      <ApolloProvider client={client}>
        <InitialData player={currentPlayer} />
        <TabsContainer />
      </ApolloProvider>
    );
  }
};

export default App;

// temporary for RN #3965
import { YellowBox } from 'react-native';
YellowBox.ignoreWarnings(['Warning: isMounted(...) is deprecated', 'Module RCTImageLoader']);
