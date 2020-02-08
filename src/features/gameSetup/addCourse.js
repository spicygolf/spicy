import React from 'react';
import {
  StyleSheet,
  View
} from 'react-native';

import GameNav from 'features/games/gamenav';
import AddCourseTabs from 'features/gameSetup/addCourseTabs';
import { AddCourseContext } from 'features/gameSetup/addCourseContext';



const AddCourse = props => {

  const { route } = props;
  const { rkey, oldTee } = route.params;
//  console.log('AddCourse', rkey, tee);

  return (
    <View style={styles.container}>
      <GameNav
        title='Add Course, Tees'
        showBack={true}
        backTo={'GameSetup'}
      />
      <AddCourseContext.Provider value={{
        rkey: rkey,
        oldTee: oldTee,
      }}>
        <AddCourseTabs />
      </AddCourseContext.Provider>
    </View>
  );

}



export default AddCourse;


const styles = StyleSheet.create({
  container: {
    flex: 1
  },
});
