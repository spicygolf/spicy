import {
  createSwitchNavigator,
  createAppContainer
} from 'react-navigation';

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


export default AppContainer;
