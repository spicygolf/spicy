import {
  createMaterialTopTabNavigator
} from 'react-navigation';

import AddCourseSearch from 'features/gameSetup/addCourseSearch';



const AddCourseTabs = createMaterialTopTabNavigator(
  {
    AddCourseSearch: {
      screen: AddCourseSearch,
      navigationOptions: {
        title: 'Search',
      },
    },
  }, {
    initialRouteName: 'AddCourseSearch',
  }
);


export default AddCourseTabs;
