import React from 'react';
import {
  View
} from 'react-native';

import GameNav from 'features/games/gamenav';

import AddCourseTabs from 'features/gameSetup/addCourseTabs';



class AddCourse extends React.Component {

  render() {
    return (
      <View>
        <GameNav
          title='Add Course, Tees'
          showBack={true}
          navigation={this.props.navigation}
        />
        <AddCourseTabs
          addFn={this.props.addFn}
        />
      </View>
    );
  }

}



export default AddCourse;
