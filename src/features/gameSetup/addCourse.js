import React from 'react';
import {
  StyleSheet,
  View
} from 'react-native';

import GameNav from 'features/games/gamenav';

import AddCourseTabs from 'features/gameSetup/addCourseTabs';



class AddCourse extends React.Component {

  // https://stackoverflow.com/questions/54038075/v1-to-v3-migration-nested-tabs
  static router = {
    ...AddCourseTabs.router,
    getStateForAction: (action, lastState) => {
      return AddCourseTabs.router.getStateForAction(action, lastState);
    },
  };

  render() {
    return (
      <View style={styles.container}>
        <GameNav
          title='Add Course, Tees'
          showBack={true}
        />
        <AddCourseTabs
          addFn={this.props.addFn}
          navigation={this.props.navigation}
        />
      </View>
    );
  }

}



export default AddCourse;


const styles = StyleSheet.create({
  container: {
    flex: 1
  },
});
