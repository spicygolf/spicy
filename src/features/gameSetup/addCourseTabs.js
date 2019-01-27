import {
  createMaterialTopTabNavigator
} from 'react-navigation';

import AddCourseFavorites from 'features/gameSetup/addCourseFavorites';
import AddCourseSearch from 'features/gameSetup/addCourseSearch';



const AddCourseTabs = createMaterialTopTabNavigator(
  {
    AddCourseFavorites: {
      screen: AddCourseFavorites,
      navigationOptions: {
        title: 'Favorites',
      },
    },
    AddCourseSearch: {
      screen: AddCourseSearch,
      navigationOptions: {
        title: 'Search'
      },
    },
  }, {
    initialRouteName: 'AddCourseFavorites',
  }
);


export default AddCourseTabs;
