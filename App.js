import React from 'react';
import { Provider } from 'react-redux';

import configureStore from 'app/store/configureStore';
import { fetchInitialData } from 'app/store/initialData';
import TabsContainer from 'features/tabs/TabsContainer';


const store = configureStore();

fetchInitialData(store);

export default class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <TabsContainer />
      </Provider>
    );
  }
};
