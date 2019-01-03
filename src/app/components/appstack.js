import {
  createBottomTabNavigator,
} from 'react-navigation';

import Feed from 'features/feed/feed';
import Games from 'features/games/games';
import Profile from 'features/profile/profile';



const AppStack = createBottomTabNavigator(
  {
    Feed: Feed,
    Games: Games,
    Profile: Profile
  },
  {

  }
);

export default AppStack;
