import React from 'react';
import {
  createSwitchNavigator,
  createAppContainer
} from 'react-navigation';

import { setTopLevelNavigator } from 'common/components/navigationService';

import Splash from 'features/splash/splash';
import AppStack from 'app/components/appstack';
import AuthStack from 'app/components/authstack';



const AppContainer = createAppContainer(createSwitchNavigator(
  {
    Splash: Splash,
    Auth: AuthStack,
    App: AppStack,
  },
  {
    initialRouteName: 'Splash',
  }
));


export default class App extends React.Component {
  render() {
    return (
      <AppContainer
        ref={navigatorRef => {
          setTopLevelNavigator(navigatorRef);
        }}
      />
    );
  }
};
